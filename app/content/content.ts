const API_BASE_URL = 'http://localhost:3000';

// Function to detect form fields
function detectFormFields(form: HTMLFormElement) {
  const fields: Array<{
    element: HTMLElement;
    name: string;
    type: string;
    id?: string;
    label?: string;
    required?: boolean;
    accept?: string;
  }> = [];

  // Get all form elements
  const elements = form.querySelectorAll('input, select, textarea');
  
  elements.forEach(element => {
    const el = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    // Skip hidden and submit/button inputs
    if (
      el.type === 'hidden' ||
      el.type === 'submit' ||
      el.type === 'button' ||
      el.type === 'reset' ||
      el.style.display === 'none' ||
      el.style.visibility === 'hidden'
    ) {
      return;
    }
    
    // Get field label
    let label = '';
    if (el.id) {
      const labelElement = document.querySelector(`label[for="${el.id}"]`);
      if (labelElement) {
        label = labelElement.textContent?.trim() || '';
      }
    }
    
    // If no label found, check parent label
    if (!label && el.parentElement?.tagName === 'LABEL') {
      label = el.parentElement.textContent?.trim() || '';
    }
    
    fields.push({
      element: el,
      name: el.name || '',
      type: el.type || 'text',
      id: el.id || undefined,
      label: label || undefined,
      required: el.required,
      accept: el instanceof HTMLInputElement ? el.accept : undefined
    });
  });
  
  return fields;
}

async function handleFileUpload(input: HTMLInputElement, documentId: string) {
  try {
    console.log('Starting file upload for document:', documentId);
    
    const response = await fetch(`${API_BASE_URL}/api/user/documents/${documentId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch file data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Received file data:', {
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.content.length
    });
    
    // Ensure content is properly padded base64
    let base64Content = data.content;
    while (base64Content.length % 4 !== 0) {
      base64Content += '=';
    }
    
    // Convert base64 to binary array
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('Converted to binary array:', {
      byteLength: bytes.length,
      firstBytes: Array.from(bytes.slice(0, 4))
    });
    
    // Create Blob with proper MIME type
    const blob = new Blob([bytes], { type: data.mimeType });
    console.log('Created blob:', {
      size: blob.size,
      type: blob.type
    });
    
    // Create File object with proper metadata
    const file = new File([blob], data.filename, {
      type: data.mimeType,
      lastModified: new Date().getTime()
    });
    
    console.log('Created File object:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Create DataTransfer object and add the file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Set the files property
    input.files = dataTransfer.files;
    
    console.log('Set files on input:', {
      filesCount: input.files.length,
      firstFileName: input.files[0]?.name
    });
    
    // Create and dispatch change event
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
    
    // Also dispatch input event for better compatibility
    const inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);
    
    // Dispatch custom event for form handling
    const customEvent = new CustomEvent('fileuploaded', {
      bubbles: true,
      detail: { file, input }
    });
    input.dispatchEvent(customEvent);
    
    console.log('File upload successful:', data.filename);
    return true;
  } catch (error) {
    console.error('Error handling file upload:', error);
    return false;
  }
}

// Function to fill form fields
async function fillForm(form: HTMLFormElement, data: any) {
  if (!data) return;
  
  const fields = detectFormFields(form);
  
  for (const field of fields) {
    const input = field.element as HTMLInputElement;
    
    // Handle file upload fields
    if (field.type === 'file' && data.fileUploads?.[field.name]) {
      const fileUpload = data.fileUploads[field.name];
      if (fileUpload.fileId) {
        await handleFileUpload(input, fileUpload.fileId);
      }
      continue;
    }
    
    // Handle other field types...
  }
}

// Export functions
export {
  handleFileUpload,
  detectFormFields,
  fillForm
}; 