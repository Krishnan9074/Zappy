'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PersonalInfoStep from './steps/PersonalInfoStep';
import DocumentUploadStep from './steps/DocumentUploadStep';
import AiPersonaStep from './steps/AiPersonaStep';
import CompletionStep from './steps/CompletionStep';

export type OnboardingData = {
  personalInfo: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
    occupation: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documents: File[];
  aiPersonaEnabled: boolean;
};

const INITIAL_DATA: OnboardingData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    occupation: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  documents: [],
  aiPersonaEnabled: true,
};

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const steps = [
    { title: 'Personal Information', component: PersonalInfoStep },
    { title: 'Document Upload', component: DocumentUploadStep },
    { title: 'AI Persona Setup', component: AiPersonaStep },
    { title: 'Completion', component: CompletionStep },
  ];

  const updateFields = (fields: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const goToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);

    try {
      // Submit personal info
      const personalInfoResponse = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.personalInfo),
      });

      if (!personalInfoResponse.ok) {
        throw new Error('Failed to save personal information');
      }

      // Upload documents if any
      if (data.documents.length > 0) {
        const formData = new FormData();
        data.documents.forEach(file => {
          formData.append('files', file);
        });

        const documentsResponse = await fetch('/api/user/documents', {
          method: 'POST',
          body: formData,
        });

        if (!documentsResponse.ok) {
          throw new Error('Failed to upload documents');
        }
      }

      // Initialize AI persona if enabled
      if (data.aiPersonaEnabled) {
        const personaResponse = await fetch('/api/user/persona', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ createPersona: true }),
        });

        if (!personaResponse.ok) {
          throw new Error('Failed to create AI persona');
        }
      }

      // Mark onboarding as completed
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });

      // Go to completion step
      setCurrentStep(steps.length - 1);
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('There was an error completing your onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="flex flex-col min-h-full">
      {/* Progress bar */}
      <div className="px-4 py-4 sm:px-6 lg:px-8 bg-white shadow">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Complete Your Profile</h2>
            <p className="text-sm text-grey-900">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <div className="mt-4 relative">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              {steps.map((step, index) => (
                <div key={index} className="relative flex flex-col items-center">
                  <div 
                    className={`w-4 h-4 rounded-full ${
                      index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></div>
                  <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-grow px-4 py-6 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <CurrentStepComponent
              data={data}
              updateFields={updateFields}
              goToNextStep={goToNextStep}
              goToPreviousStep={goToPreviousStep}
              isLastStep={currentStep === steps.length - 2}
              isFirstStep={currentStep === 0}
              submitForm={submitOnboarding}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 