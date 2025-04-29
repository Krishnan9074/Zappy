// Content script for ZappForm extension
// This script handles form detection and autofill on webpages

// Initialize variables
let formValues = {};
let isExtensionActive = false;
let currentUrl = window.location.href;
let currentDomain = window.location.hostname;
let formFieldsOnPage = [];
let autoFillButton = null;
let canAutoFill = false;
let formDetectionInterval;

// Document ready function
function onDocumentReady() {
  console.log('ZappForm content script loaded');
  
  // Check if the extension is active
  chrome.storage.local.get(['isActive'], (result) => {
    if (result.isActive) {
      // Start scanning for forms
      startFormDetection();
      
      // Add scan button for Google Forms
      if (currentDomain.includes('docs.google.com') && currentUrl.includes('forms')) {
        createScanButton();
      } else {
        // Create autofill button if needed
        createAutoFillButton();
      }
    }
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) {
      return;
    }
    
    switch (message.type) {
      case 'FILL_FORM':
        if (message.data && message.data.formData) {
          fillForm(message.data.formData);
          showSuccessMessage();
        }
        break;
        
      case 'TOGGLE_EXTENSION':
        const isActive = message.data.isActive;
        if (isActive) {
          startFormDetection();
          if (currentDomain.includes('docs.google.com') && currentUrl.includes('forms')) {
            createScanButton();
          } else {
            createAutoFillButton();
          }
        } else {
          stopFormDetection();
          removeAutoFillButton();
          // Remove scan button if it exists
          const scanButton = document.getElementById('zappform-scan-button');
          if (scanButton) {
            scanButton.remove();
          }
        }
        break;
        
      case 'MANUAL_FILL':
        // Re-scan for forms and request filling data
        formFieldsOnPage = [];
        if (currentDomain.includes('docs.google.com') && currentUrl.includes('forms')) {
          scanGoogleForm();
        } else {
          scanForForms();
        }
        // Form data will be sent in the FILL_FORM response
        break;
    }
  });
}

// Show success message after filling
function showSuccessMessage() {
  // Create the success message element if it doesn't exist
  let successMessage = document.getElementById('zappform-success-message');
  
  if (!successMessage) {
    successMessage = document.createElement('div');
    successMessage.id = 'zappform-success-message';
    successMessage.style.position = 'fixed';
    successMessage.style.bottom = '20px';
    successMessage.style.right = '20px';
    successMessage.style.padding = '10px 20px';
    successMessage.style.backgroundColor = '#4CAF50';
    successMessage.style.color = 'white';
    successMessage.style.borderRadius = '4px';
    successMessage.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    successMessage.style.zIndex = '10000';
    successMessage.style.transition = 'opacity 0.5s ease-in-out';
    successMessage.style.opacity = '0';
    
    document.body.appendChild(successMessage);
  }
  
  // Set the message text
  successMessage.textContent = 'Form filled successfully by ZappForm';
  
  // Show the message
  setTimeout(() => {
    successMessage.style.opacity = '1';
  }, 100);
  
  // Hide the message after a few seconds
  setTimeout(() => {
    successMessage.style.opacity = '0';
    
    // Remove the element after fade out
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.parentNode.removeChild(successMessage);
      }
    }, 500);
  }, 3000);
}

// Create auto-fill button
function createAutoFillButton() {
  // Remove any existing button
  const existingButton = document.getElementById('zappform-autofill-button');
  if (existingButton) {
    existingButton.parentNode.removeChild(existingButton);
  }
  
  // Create the button
  const button = document.createElement('button');
  button.id = 'zappform-autofill-button';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 11 12 14 22 4"></polyline>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
    <span>Fill Form</span>
  `;
  
  // Style the button
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.padding = '10px 16px';
  button.style.backgroundColor = '#4361ee';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  button.style.fontFamily = 'Arial, sans-serif';
  button.style.fontSize = '14px';
  button.style.fontWeight = 'bold';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.gap = '8px';
  button.style.zIndex = '10000';
  button.style.transition = 'background-color 0.3s ease';
  
  // Add hover effect
  button.onmouseover = function() {
    this.style.backgroundColor = '#3a56d4';
  };
  
  button.onmouseout = function() {
    this.style.backgroundColor = '#4361ee';
  };
  
  // Add click event
  button.onclick = function() {
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="16 12 12 8 8 12"></polyline>
        <line x1="12" y1="16" x2="12" y2="8"></line>
      </svg>
      <span>Filling...</span>
    `;
    button.disabled = true;
    button.style.backgroundColor = '#888';
    
    // Request form filling data from background script
    chrome.runtime.sendMessage({ type: 'MANUAL_FILL' });
    
    // Remove button after a short delay
    setTimeout(() => {
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
    }, 2000);
  };
  
  // Add to the page
  document.body.appendChild(button);
}

// Remove auto-fill button
function removeAutoFillButton() {
  if (autoFillButton && autoFillButton.parentNode) {
    autoFillButton.parentNode.removeChild(autoFillButton);
  }
  autoFillButton = null;
}

// Scan the page for forms
function scanForForms() {
  console.log('Scanning for forms on page...');
  
  // Reset the form fields array
  formFieldsOnPage = [];
  
  // Special handling for Google Forms
  if (window.location.href.includes('docs.google.com/forms')) {
    console.log('Google Form detected');
    scanGoogleForm();
    
    // If we found form fields, notify the background script
    if (formFieldsOnPage.length > 0) {
      console.log(`Found ${formFieldsOnPage[0].fields.length} fields in Google Form`);
      
      chrome.runtime.sendMessage({
        type: 'FORMS_DETECTED',
        data: {
          url: window.location.href,
          domain: new URL(window.location.href).hostname,
          forms: formFieldsOnPage
        }
      });
      
      // Create a button for manual filling
      createAutoFillButton();
      return true;
    }
    return false;
  }
  
  // Process regular forms
  const forms = document.querySelectorAll('form');
  console.log(`Found ${forms.length} form elements on page`);
  
  if (forms.length === 0) {
    console.log('No form elements detected, scanning for inputs');
    // If no forms, look for inputs not in a form
    scanForFormlessInputs();
  } else {
    // Process each form
    forms.forEach((form, formIndex) => {
      scanForm(form, formIndex);
    });
  }
  
  // If we found form fields, notify the background script
  if (formFieldsOnPage.length > 0) {
    console.log(`Found ${formFieldsOnPage.length} forms with fields`);
    
    chrome.runtime.sendMessage({
      type: 'FORMS_DETECTED',
      data: {
        url: window.location.href,
        domain: new URL(window.location.href).hostname,
        forms: formFieldsOnPage
      }
    });
    
    // Create a button for manual filling
    createAutoFillButton();
    return true;
  }
  
  return false;
}

// Improved Google Form detection
function scanGoogleForm() {
  console.log("Scanning for Google Form elements...");
  
  const formFields = [];
  let questionCount = 0;
  
  // Check for newer Google Forms structure
  const questions = document.querySelectorAll('div[role="listitem"]');
  if (questions && questions.length > 0) {
    console.log(`Found ${questions.length} questions in Google Form`);
    questionCount = questions.length;
    
    // Process each question
    questions.forEach((question, index) => {
      // Try to find the question title
      const titleElement = question.querySelector('.M7eMe') || question.querySelector('.lQ2kAd');
      const questionTitle = titleElement ? titleElement.textContent.trim() : `Question ${index + 1}`;
      
      // Check for text inputs (short/long answer)
      const textInputs = question.querySelectorAll('input[type="text"], textarea');
      if (textInputs.length > 0) {
        textInputs.forEach(input => {
          formFields.push({
            element: input,
            type: input.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text',
            name: input.name || input.id || `question_${index}`,
            id: input.id || input.name || `question_${index}`,
            label: questionTitle
          });
        });
        console.log(`Found text input for question: "${questionTitle}"`);
      }
      
      // Check for radio buttons (multiple choice)
      const radioInputs = question.querySelectorAll('input[type="radio"]');
      if (radioInputs.length > 0) {
        // Group radio buttons by name
        const radioGroups = {};
        radioInputs.forEach(radio => {
          const name = radio.name || `radio_group_${index}`;
          if (!radioGroups[name]) {
            radioGroups[name] = [];
          }
          // Find the label for this radio option
          const radioLabel = findInputLabel(radio);
          radioGroups[name].push({
            element: radio,
            value: radio.value,
            label: radioLabel
          });
        });
        
        // Add each radio group as a field
        Object.entries(radioGroups).forEach(([name, options]) => {
          formFields.push({
            element: options[0].element,
            type: 'radio',
            name: name,
            id: name,
            label: questionTitle,
            options: options.map(o => ({ value: o.value, label: o.label, element: o.element }))
          });
        });
        console.log(`Found radio inputs for question: "${questionTitle}"`);
      }
      
      // Check for checkboxes
      const checkboxInputs = question.querySelectorAll('input[type="checkbox"]');
      if (checkboxInputs.length > 0) {
        // Group checkboxes by name
        const checkboxGroups = {};
        checkboxInputs.forEach(checkbox => {
          const name = checkbox.name || `checkbox_group_${index}`;
          if (!checkboxGroups[name]) {
            checkboxGroups[name] = [];
          }
          // Find the label for this checkbox option
          const checkboxLabel = findInputLabel(checkbox);
          checkboxGroups[name].push({
            element: checkbox,
            value: checkbox.value,
            label: checkboxLabel
          });
        });
        
        // Add each checkbox group as a field
        Object.entries(checkboxGroups).forEach(([name, options]) => {
          formFields.push({
            element: options[0].element,
            type: 'checkbox',
            name: name,
            id: name,
            label: questionTitle,
            options: options.map(o => ({ value: o.value, label: o.label, element: o.element }))
          });
        });
        console.log(`Found checkbox inputs for question: "${questionTitle}"`);
      }
      
      // Check for dropdown selects
      const selects = question.querySelectorAll('select');
      if (selects.length > 0) {
        selects.forEach(select => {
          formFields.push({
            element: select,
            type: 'select',
            name: select.name || select.id || `select_${index}`,
            id: select.id || select.name || `select_${index}`,
            label: questionTitle,
            options: Array.from(select.options).map(option => ({
              value: option.value,
              label: option.textContent
            }))
          });
        });
        console.log(`Found select dropdown for question: "${questionTitle}"`);
      }
    });
  }
  
  // If no fields found with the newer structure, try a more generic approach
  if (formFields.length === 0) {
    console.log("No fields found with standard Google Forms structure, trying alternative detection...");
    
    // Look for any inputs with nearby labels
    const inputs = document.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="tel"]');
    inputs.forEach((input, index) => {
      const label = findInputLabel(input) || `Field ${index + 1}`;
      formFields.push({
        element: input,
        type: input.type || 'text',
        name: input.name || input.id || `field_${index}`,
        id: input.id || input.name || `field_${index}`,
        label: label
      });
      console.log(`Found generic input: "${label}"`);
    });
    
    // Look for radio button groups
    const radioGroups = {};
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach((radio, index) => {
      const name = radio.name || `radio_group_${index}`;
      if (!radioGroups[name]) {
        radioGroups[name] = [];
      }
      const radioLabel = findInputLabel(radio);
      radioGroups[name].push({
        element: radio,
        value: radio.value,
        label: radioLabel
      });
    });
    
    Object.entries(radioGroups).forEach(([name, options]) => {
      // Try to find a common parent with a label
      const parentLabel = findGroupLabel(options[0].element) || name;
      formFields.push({
        element: options[0].element,
        type: 'radio',
        name: name,
        id: name,
        label: parentLabel,
        options: options.map(o => ({ value: o.value, label: o.label, element: o.element }))
      });
      console.log(`Found generic radio group: "${parentLabel}"`);
    });
  }
  
  console.log(`Total form fields detected: ${formFields.length}`);
  formFieldsOnPage.push({
    id: 'google-form',
    type: 'google-form',
    fields: formFields
  });
}

// Extract field information from an input element
function extractFieldInfo(input) {
  // Skip hidden, submit, button, and password fields
  if (
    input.type === 'hidden' ||
    input.type === 'submit' ||
    input.type === 'button' ||
    input.type === 'password' ||
    input.type === 'file' ||
    input.type === 'image' ||
    input.type === 'reset' ||
    input.style.display === 'none' ||
    input.style.visibility === 'hidden' ||
    input.getAttribute('aria-hidden') === 'true'
  ) {
    return null;
  }
  
  // Get the field's label
  let label = '';
  
  // Check for label element
  if (input.id) {
    const labelElement = document.querySelector(`label[for="${input.id}"]`);
    if (labelElement) {
      label = labelElement.textContent.trim();
    }
  }
  
  // If no label found, check for nearby text
  if (!label) {
    const parent = input.parentElement;
    if (parent) {
      // Get text nodes directly inside the parent
      for (let i = 0; i < parent.childNodes.length; i++) {
        const node = parent.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          label = node.textContent.trim();
          break;
        }
      }
      
      // If still no label, check for previous siblings
      if (!label) {
        const prevSibling = input.previousElementSibling;
        if (prevSibling && prevSibling.tagName !== 'INPUT' && prevSibling.tagName !== 'SELECT' && prevSibling.tagName !== 'TEXTAREA') {
          label = prevSibling.textContent.trim();
        }
      }
    }
  }
  
  // If there's still no label, use placeholder or name as fallback
  if (!label) {
    label = input.placeholder || input.name || '';
  }
  
  return {
    name: input.name || '',
    id: input.id || '',
    type: input.type || input.tagName.toLowerCase(),
    label: label,
    required: input.required || false,
    element: input
  };
}

// Look for inputs that might be part of an implied form
function scanForInputClusters() {
  const inputs = document.querySelectorAll('input, select, textarea');
  
  if (inputs.length === 0) return;
  
  // Group inputs by their closest container
  const containerMap = new Map();
  
  inputs.forEach(input => {
    // Skip hidden and submit inputs
    if (
      input.type === 'hidden' ||
      input.type === 'submit' ||
      input.type === 'button' ||
      input.type === 'password'
    ) {
      return;
    }
    
    // Find the closest div that might be a form container
    let container = input.parentElement;
    let depth = 0;
    const maxDepth = 3; // Don't go too far up the DOM
    
    while (container && depth < maxDepth) {
      // If this container already has other inputs, it's likely a form
      if (container.querySelectorAll('input, select, textarea').length > 1) {
        break;
      }
      
      container = container.parentElement;
      depth++;
    }
    
    if (container) {
      if (!containerMap.has(container)) {
        containerMap.set(container, []);
      }
      
      containerMap.get(container).push(input);
    }
  });
  
  // Process each container that has multiple inputs
  let formIndex = 0;
  containerMap.forEach((inputs, container) => {
    if (inputs.length > 1) {
      const formFields = [];
      
      inputs.forEach(input => {
        const field = extractFieldInfo(input);
        if (field) {
          formFields.push(field);
        }
      });
      
      if (formFields.length > 0) {
        formFieldsOnPage.push({
          formIndex,
          formId: `implied-form-${formIndex}`,
          fields: formFields
        });
        
        formIndex++;
      }
    }
  });
  
  // Send form data to background script
  if (formFieldsOnPage.length > 0) {
    canAutoFill = true;
    chrome.runtime.sendMessage({
      type: 'FORMS_DETECTED',
      data: {
        url: currentUrl,
        domain: currentDomain,
        forms: formFieldsOnPage
      }
    });
    
    // Create or update the auto-fill button
    createAutoFillButton();
  }
}

// Fill a form with provided data
function fillForm(data) {
  if (!data) return;
  
  console.log('Starting form fill with data:', data);
  
  // Create a field mapping for easier lookup
  const fieldMapping = {};
  
  // Add direct field names
  Object.entries(data).forEach(([key, value]) => {
    fieldMapping[key.toLowerCase()] = value;
    
    // Add normalized version (no spaces, underscores, etc.)
    const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '');
    fieldMapping[normalizedKey] = value;
  });
  
  // Check if we're on Google Forms
  const isGoogleForm = window.location.href.includes('docs.google.com/forms');
  
  // Process each form on the page
  formFieldsOnPage.forEach(form => {
    console.log(`Filling form ${form.id} with ${form.fields.length} fields`);
    
    form.fields.forEach(field => {
      const input = field.element;
      let value = null;
      let matchSource = '';
      
      // Try to find a match in the field mapping
      if (field.name && fieldMapping[field.name.toLowerCase()]) {
        value = fieldMapping[field.name.toLowerCase()];
        matchSource = 'field name';
      } else if (field.id && fieldMapping[field.id.toLowerCase()]) {
        value = fieldMapping[field.id.toLowerCase()];
        matchSource = 'field id';
      } else if (field.label) {
        const normalizedLabel = field.label.toLowerCase().replace(/[\s_-]/g, '');
        if (fieldMapping[normalizedLabel]) {
          value = fieldMapping[normalizedLabel];
          matchSource = 'field label';
        }
      }
      
      // If no match yet, try label-based heuristics
      if (!value && field.label) {
        const fieldText = field.label.toLowerCase();
        
        if (/first.*name|fname|given.*name/i.test(fieldText)) {
          value = data.firstName || data.first_name || (data.name ? data.name.split(' ')[0] : null);
          matchSource = 'heuristic: first name';
        } else if (/last.*name|lname|surname|family.*name/i.test(fieldText)) {
          value = data.lastName || data.last_name || (data.name ? data.name.split(' ').slice(1).join(' ') : null);
          matchSource = 'heuristic: last name';
        } else if (/full.*name|name/i.test(fieldText)) {
          value = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim();
          matchSource = 'heuristic: full name';
        } else if (/email|e-mail/i.test(fieldText)) {
          value = data.email;
          matchSource = 'heuristic: email';
        } else if (/phone|tel|mobile|cell/i.test(fieldText)) {
          value = data.phone || data.phoneNumber || data.mobile;
          matchSource = 'heuristic: phone';
        } else if (/address|street/i.test(fieldText)) {
          value = data.address || data.addressLine1;
          matchSource = 'heuristic: address';
        } else if (/city/i.test(fieldText)) {
          value = data.city;
          matchSource = 'heuristic: city';
        } else if (/state|province|region/i.test(fieldText)) {
          value = data.state || data.province || data.region;
          matchSource = 'heuristic: state';
        } else if (/zip|postal|postcode/i.test(fieldText)) {
          value = data.zip || data.zipCode || data.postalCode;
          matchSource = 'heuristic: zip';
        } else if (/country/i.test(fieldText)) {
          value = data.country;
          matchSource = 'heuristic: country';
        }
      }
      
      // Handle file upload fields
      if (field.type === 'file' && data.fileUploads && data.fileUploads[field.name]) {
        const fileUpload = data.fileUploads[field.name];
        if (fileUpload.fileId) {
          // Trigger file upload
          handleFileUpload(input, fileUpload.fileId);
          matchSource = 'file upload';
        }
      }
      
      // Fill the field if we found a match
      if (value) {
        console.log(`Filling field "${field.name || field.id}" (${field.type}) with value from ${matchSource}`);
        
        switch (field.type) {
          case 'text':
          case 'email':
          case 'tel':
          case 'number':
          case 'textarea':
            // For text-like inputs
            fillInputField(input, value, isGoogleForm);
            break;
            
          case 'select':
            // For dropdowns
            fillSelectField(input, value);
            break;
            
          case 'radio':
            // For radio buttons
            fillRadioField(field, value);
            break;
            
          case 'checkbox':
            // For checkboxes
            fillCheckboxField(field, value);
            break;
            
          default:
            console.log(`Unsupported field type: ${field.type}`);
        }
      } else {
        console.log(`No matching value found for field "${field.name || field.id}" (${field.type}) with label "${field.label}"`);
      }
    });
  });
  
  // Show success message
  showSuccessMessage();
}

// Handle file upload
async function handleFileUpload(input, fileId) {
  try {
    // Get file data from the server
    const response = await fetch(`${getApiBaseUrl()}/api/user/documents/${fileId}`);
    if (!response.ok) throw new Error('Failed to fetch file data');
    
    const fileData = await response.json();
    
    // Create a File object
    const file = new File([fileData.content], fileData.filename, {
      type: fileData.mimeType
    });
    
    // Create a DataTransfer object
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Set the files property of the input
    input.files = dataTransfer.files;
    
    // Trigger change event
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`File uploaded: ${fileData.filename}`);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

// Helper function to fill input field and trigger necessary events
function fillInputField(input, value, isGoogleForm) {
  // Set the value
  input.value = value;
  
  // Trigger events
  // For Google Forms, we need special event handling
  if (isGoogleForm) {
    // Focus the field
    input.focus();
    
    // Dispatch events that Google Forms listens for
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    
    // Blur the field to trigger Google Forms validation
    setTimeout(() => {
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    }, 100);
  } else {
    // Standard event dispatching for regular forms
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Helper function to fill select fields
function fillSelectField(select, value) {
  const normalizedValue = value.toString().toLowerCase().trim();
  
  // First try exact match
  for (let i = 0; i < select.options.length; i++) {
    const option = select.options[i];
    if (option.value === value || option.textContent === value) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
  }
  
  // Try case-insensitive match
  for (let i = 0; i < select.options.length; i++) {
    const option = select.options[i];
    if (option.value.toLowerCase() === normalizedValue || 
        option.textContent.toLowerCase() === normalizedValue) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
  }
  
  // Try partial match
  for (let i = 0; i < select.options.length; i++) {
    const option = select.options[i];
    if (option.textContent.toLowerCase().includes(normalizedValue) || 
        normalizedValue.includes(option.textContent.toLowerCase())) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
  }
}

// Helper function to fill radio fields
function fillRadioField(field, value) {
  if (!field.options || !field.options.length) return;
  
  const normalizedValue = value.toString().toLowerCase().trim();
  let matched = false;
  
  // First try exact match on value
  for (const option of field.options) {
    if (option.value === value || option.label === value) {
      option.element.checked = true;
      option.element.dispatchEvent(new Event('change', { bubbles: true }));
      matched = true;
      break;
    }
  }
  
  // If no match, try case-insensitive
  if (!matched) {
    for (const option of field.options) {
      if (option.value.toLowerCase() === normalizedValue || 
          option.label?.toLowerCase() === normalizedValue) {
        option.element.checked = true;
        option.element.dispatchEvent(new Event('change', { bubbles: true }));
        matched = true;
        break;
      }
    }
  }
  
  // If still no match, try partial
  if (!matched) {
    for (const option of field.options) {
      if (option.label && (
          option.label.toLowerCase().includes(normalizedValue) || 
          normalizedValue.includes(option.label.toLowerCase()))) {
        option.element.checked = true;
        option.element.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  }
}

// Helper function to fill checkbox fields
function fillCheckboxField(field, value) {
  if (!field.options || !field.options.length) return;
  
  // For a single value string, try to match any option
  if (typeof value === 'string') {
    const normalizedValue = value.toLowerCase().trim();
    
    for (const option of field.options) {
      if (option.value === value || 
          option.label === value ||
          option.label?.toLowerCase() === normalizedValue ||
          option.label?.toLowerCase().includes(normalizedValue) ||
          normalizedValue.includes(option.label?.toLowerCase())) {
        option.element.checked = true;
        option.element.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  }
  
  // For arrays of values, check all matching options
  if (Array.isArray(value)) {
    const normalizedValues = value.map(v => v.toString().toLowerCase().trim());
    
    for (const option of field.options) {
      const optionText = option.label?.toLowerCase();
      
      if (normalizedValues.includes(option.value.toLowerCase()) || 
          normalizedValues.includes(optionText)) {
        option.element.checked = true;
        option.element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
}

// Helper to find label for an input
function findInputLabel(input) {
  // First check for label with 'for' attribute
  const id = input.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim();
  }
  
  // Check for parent label
  let parent = input.parentElement;
  while (parent) {
    if (parent.tagName === 'LABEL') {
      return parent.textContent.trim();
    }
    
    // Check for label as sibling
    const siblings = parent.childNodes;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling.nodeType === 1 && sibling.tagName === 'LABEL') {
        return sibling.textContent.trim();
      }
    }
    
    // Look for any text node that might be a label
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling.nodeType === 3 && sibling.textContent.trim()) {
        return sibling.textContent.trim();
      }
    }
    
    parent = parent.parentElement;
  }
  
  // If all else fails, look for nearby elements that might be labels
  const possibleLabels = ['span', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  for (const tag of possibleLabels) {
    const elements = input.parentElement.querySelectorAll(tag);
    for (const el of elements) {
      if (el.textContent.trim()) {
        return el.textContent.trim();
      }
    }
  }
  
  return '';
}

// Helper to find label for a group of inputs
function findGroupLabel(input) {
  let element = input.parentElement;
  const maxLevelsUp = 3;
  
  for (let i = 0; i < maxLevelsUp && element; i++) {
    // Look for headings or div/spans with text
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6, legend');
    for (const heading of headings) {
      if (heading.textContent.trim()) {
        return heading.textContent.trim();
      }
    }
    
    // Look for divs or spans that might be labels
    const possibleLabels = element.querySelectorAll('div, span, p');
    for (const label of possibleLabels) {
      // Skip if this element contains the input or other inputs
      if (label.contains(input) || label.querySelectorAll('input').length > 0) {
        continue;
      }
      
      if (label.textContent.trim()) {
        return label.textContent.trim();
      }
    }
    
    element = element.parentElement;
  }
  
  return '';
}

// Start the form detection process
function startFormDetection() {
  // Clear any existing intervals first
  stopFormDetection();
  
  // Initial scan
  scanForForms();
  
  // Set up interval for continuous scanning
  formDetectionInterval = setInterval(scanForForms, 3000);
}

// Stop the form detection process
function stopFormDetection() {
  if (formDetectionInterval) {
    clearInterval(formDetectionInterval);
    formDetectionInterval = null;
  }
}

// Create and add a scan button directly on the page
function createScanButton() {
  // Remove any existing scan button
  const existingScanButton = document.getElementById('zappform-scan-button');
  if (existingScanButton) {
    existingScanButton.remove();
  }
  
  // Create the scan button
  const scanButton = document.createElement('button');
  scanButton.id = 'zappform-scan-button';
  scanButton.textContent = 'Scan with ZappForm';
  scanButton.style.position = 'fixed';
  scanButton.style.top = '20px';
  scanButton.style.right = '20px';
  scanButton.style.backgroundColor = '#4285F4';
  scanButton.style.color = 'white';
  scanButton.style.padding = '10px 15px';
  scanButton.style.borderRadius = '4px';
  scanButton.style.border = 'none';
  scanButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  scanButton.style.cursor = 'pointer';
  scanButton.style.zIndex = '9999';
  scanButton.style.fontSize = '14px';
  scanButton.style.fontWeight = 'bold';
  
  // Add hover effect
  scanButton.onmouseover = function() {
    this.style.backgroundColor = '#3367D6';
  };
  scanButton.onmouseout = function() {
    this.style.backgroundColor = '#4285F4';
  };
  
  // Add click handler
  scanButton.addEventListener('click', function() {
    this.textContent = 'Scanning...';
    this.disabled = true;
    
    // Force rescan
    formFieldsOnPage = [];
    setTimeout(() => {
      const success = scanGoogleForm();
      if (success) {
        this.textContent = 'Form Detected!';
        setTimeout(() => {
          this.textContent = 'Fill Form';
          this.disabled = false;
          this.onclick = function() {
            chrome.runtime.sendMessage({ type: 'MANUAL_FILL' });
            this.textContent = 'Filling...';
            this.disabled = true;
            setTimeout(() => {
              this.textContent = 'Filled!';
              setTimeout(() => {
                this.textContent = 'Fill Again';
                this.disabled = false;
              }, 2000);
            }, 1000);
          };
        }, 1000);
      } else {
        this.textContent = 'No Form Found';
        setTimeout(() => {
          this.textContent = 'Try Again';
          this.disabled = false;
        }, 2000);
      }
    }, 500);
  });
  
  // Add to document
  document.body.appendChild(scanButton);
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDocumentReady);
} else {
  onDocumentReady();
} 