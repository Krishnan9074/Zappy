import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const persona = await prisma.aiPersona.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
    });
    
    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }
    
    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error fetching AI persona:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { createPersona } = await request.json();
    
    if (!createPersona) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    // Check if user has existing personas
    const existingPersona = await prisma.aiPersona.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
    });
    
    // Create a new AI persona with PROCESSING status
    const persona = await prisma.aiPersona.create({
      data: {
        userId: session.user.id,
        version: existingPersona ? existingPersona.version + 1 : 1,
        status: 'PROCESSING',
        metadata: { 
          createdAt: new Date().toISOString(),
          source: 'onboarding' 
        },
      },
    });
    
    // Start an asynchronous process to build the AI persona
    // using a self-executing async function to not block the response
    (async () => {
      try {
        // 1. Gather user data for AI training
        const userData = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: {
            profile: true,
            documents: {
              where: { processingStatus: 'COMPLETED' },
            },
            userData: true,
          },
        });
        
        if (!userData) {
          throw new Error('User data not found');
        }
        
        // 2. Extract and structure training data
        const trainableData = {
          personalInfo: {
            name: userData.name,
            email: userData.email,
            firstName: userData.profile?.firstName,
            lastName: userData.profile?.lastName,
            phoneNumber: userData.profile?.phoneNumber,
            dateOfBirth: userData.profile?.dateOfBirth,
            gender: userData.profile?.gender,
            occupation: userData.profile?.occupation,
            address: {
              line1: userData.profile?.addressLine1,
              line2: userData.profile?.addressLine2,
              city: userData.profile?.city,
              state: userData.profile?.state,
              postalCode: userData.profile?.postalCode,
              country: userData.profile?.country,
            },
          },
          formFields: userData.userData.reduce((acc: Record<string, { value: string, category: string }>, item: { key: string, value: string, category: string }) => {
            acc[item.key] = {
              value: item.value,
              category: item.category,
            };
            return acc;
          }, {} as Record<string, { value: string, category: string }>),
          documentData: userData.documents.map((doc: { id: string, originalName: string, mimeType: string, extractedData: any }) => ({
            id: doc.id,
            name: doc.originalName,
            type: doc.mimeType,
            extractedData: doc.extractedData,
          })),
        };
        
        // 3. Process training data (this would involve potentially complex ML operations)
        // In a production app, this would likely call an external ML service or queue
        
        // Create embeddings and process mappings between form fields and user data
        const fieldMappings = await generateFieldMappings(trainableData);
        
        // Create AI response templates based on user data
        const responseTemplates = await generateResponseTemplates(trainableData);
        
        // Create heuristics for field recognition
        const fieldHeuristics = await generateFieldHeuristics(trainableData);
        
        // 4. Save the processed training data back to the persona
        await prisma.aiPersona.update({
          where: { id: persona.id },
          data: { 
            status: 'TRAINED',
            trainingData: {
              fieldMappings,
              responseTemplates,
              fieldHeuristics,
              lastUpdated: new Date().toISOString(),
              version: persona.version,
            },
            metadata: {
              ...persona.metadata,
              completedAt: new Date().toISOString(),
              dataPoints: Object.keys(trainableData.formFields).length + trainableData.documentData.length,
              confidence: calculateConfidenceScore(trainableData),
            }
          },
        });
        
        // 5. Log the successful training
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'PERSONA_TRAINED',
            resource: 'AI_PERSONA',
            resourceId: persona.id,
            metadata: {
              version: persona.version,
              dataPoints: Object.keys(trainableData.formFields).length + trainableData.documentData.length,
            },
          },
        });
        
      } catch (error) {
        console.error('Error training AI persona:', error);
        
        // Update the persona status to FAILED
        await prisma.aiPersona.update({
          where: { id: persona.id },
          data: { 
            status: 'FAILED',
            metadata: {
              ...persona.metadata,
              error: error instanceof Error ? error.message : 'Unknown error',
              failedAt: new Date().toISOString(),
            }
          },
        });
        
        // Log the failure
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'PERSONA_TRAINING_FAILED',
            resource: 'AI_PERSONA',
            resourceId: persona.id,
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        });
      }
    })();
    
    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error creating AI persona:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions for AI persona training

async function generateFieldMappings(trainableData: any) {
  // This would map user data to common form fields
  // For example, matching "fname", "firstName", "first_name" to the user's first name
  
  const fieldMappings: Record<string, string[]> = {};
  
  // Map personal information fields
  if (trainableData.personalInfo.firstName) {
    fieldMappings.firstName = ['fname', 'first_name', 'first-name', 'given-name', 'givenname'];
  }
  
  if (trainableData.personalInfo.lastName) {
    fieldMappings.lastName = ['lname', 'last_name', 'last-name', 'family-name', 'familyname', 'surname'];
  }
  
  if (trainableData.personalInfo.email) {
    fieldMappings.email = ['email', 'email_address', 'emailaddress', 'e-mail'];
  }
  
  if (trainableData.personalInfo.phoneNumber) {
    fieldMappings.phoneNumber = ['phone', 'telephone', 'tel', 'mobile', 'cell', 'cellphone'];
  }
  
  // Add address mappings
  if (trainableData.personalInfo.address.line1) {
    fieldMappings.addressLine1 = ['address', 'addr', 'street', 'address1', 'address_line_1', 'address-line-1'];
  }
  
  if (trainableData.personalInfo.address.city) {
    fieldMappings.city = ['city', 'town', 'locality'];
  }
  
  if (trainableData.personalInfo.address.state) {
    fieldMappings.state = ['state', 'province', 'region', 'administrative_area'];
  }
  
  if (trainableData.personalInfo.address.postalCode) {
    fieldMappings.postalCode = ['zip', 'zipcode', 'zip_code', 'postal', 'postal_code', 'postcode'];
  }
  
  if (trainableData.personalInfo.address.country) {
    fieldMappings.country = ['country', 'nation'];
  }
  
  // Map form fields from user data
  Object.entries(trainableData.formFields).forEach(([key, data]: [string, any]) => {
    const fieldName = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    fieldMappings[key] = [fieldName];
    
    // Add category-based synonyms
    if (data.category === 'personal') {
      fieldMappings[key].push(`personal_${fieldName}`);
    } else if (data.category === 'professional') {
      fieldMappings[key].push(`professional_${fieldName}`, `work_${fieldName}`);
    }
  });
  
  return fieldMappings;
}

async function generateResponseTemplates(trainableData: any) {
  // Create templated responses for different types of forms
  
  const templates: Record<string, Record<string, any>> = {
    contact: {
      name: `${trainableData.personalInfo.firstName} ${trainableData.personalInfo.lastName}`,
      email: trainableData.personalInfo.email,
      phone: trainableData.personalInfo.phoneNumber,
    },
    address: {
      line1: trainableData.personalInfo.address.line1,
      line2: trainableData.personalInfo.address.line2,
      city: trainableData.personalInfo.address.city,
      state: trainableData.personalInfo.address.state,
      postalCode: trainableData.personalInfo.address.postalCode,
      country: trainableData.personalInfo.address.country,
    },
    professional: {
      occupation: trainableData.personalInfo.occupation,
    },
  };
  
  // Add custom templates based on userData
  Object.entries(trainableData.formFields).forEach(([key, data]: [string, any]) => {
    if (!templates[data.category]) {
      templates[data.category] = {};
    }
    templates[data.category][key] = data.value;
  });
  
  return templates;
}

async function generateFieldHeuristics(trainableData: any) {
  // Create heuristics for identifying form fields based on:
  // - Label text
  // - Field name/id attributes
  // - Field position in forms
  // - Field types
  
  const heuristics: Record<string, any> = {
    labelMatching: {
      firstName: ['First Name', 'Given Name', 'First'],
      lastName: ['Last Name', 'Surname', 'Family Name', 'Last'],
      email: ['Email', 'Email Address', 'E-mail'],
      phoneNumber: ['Phone', 'Telephone', 'Mobile', 'Cell', 'Phone Number'],
      addressLine1: ['Address', 'Street Address', 'Street', 'Address Line 1'],
      city: ['City', 'Town'],
      state: ['State', 'Province', 'Region'],
      postalCode: ['Zip', 'Zip Code', 'Postal Code', 'Postcode'],
      country: ['Country', 'Nation'],
    },
    fieldTypeMatching: {
      email: 'email',
      phoneNumber: 'tel',
      dateOfBirth: 'date',
      postalCode: 'number',
    },
    patterns: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phoneNumber: /^[\d\s\-+()]{7,20}$/,
      postalCode: /^[\d\-\s]{5,10}$/,
    },
  };
  
  // Add custom field heuristics from user data
  Object.entries(trainableData.formFields).forEach(([key, data]: [string, any]) => {
    // Add field-specific patterns if we can detect them
    if (typeof data.value === 'string') {
      if (data.value.includes('@') && data.value.includes('.')) {
        heuristics.patterns[key] = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        heuristics.fieldTypeMatching[key] = 'email';
      } else if (/^\d+$/.test(data.value)) {
        heuristics.fieldTypeMatching[key] = 'number';
      }
    }
  });
  
  return heuristics;
}

function calculateConfidenceScore(trainableData: any) {
  // Calculate a confidence score for the AI persona based on data completeness
  let score = 0;
  let maxScore = 0;
  
  // Basic personal info checks
  const personalInfoFields = [
    'firstName', 'lastName', 'email', 'phoneNumber', 
    'occupation', 'dateOfBirth', 'gender'
  ];
  
  personalInfoFields.forEach(field => {
    maxScore += 10;
    if (trainableData.personalInfo[field]) {
      score += 10;
    }
  });
  
  // Address completeness
  const addressFields = ['line1', 'city', 'state', 'postalCode', 'country'];
  
  addressFields.forEach(field => {
    maxScore += 8;
    if (trainableData.personalInfo.address[field]) {
      score += 8;
    }
  });
  
  // Form field data points
  const formFieldCount = Object.keys(trainableData.formFields).length;
  maxScore += 50;
  score += Math.min(formFieldCount * 5, 50);
  
  // Document data
  const documentCount = trainableData.documentData.length;
  maxScore += 30;
  score += Math.min(documentCount * 10, 30);
  
  return Math.round((score / maxScore) * 100);
} 