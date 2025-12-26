// PropaScan Extension
console.log('PropaScan Extension loaded!');

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM loaded');

  // Get DOM elements
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const clearImageBtn = document.getElementById('clearImageBtn');
  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // Maximum file size (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Image upload handler
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, GIF, etc.)');
      imageInput.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size exceeds 10MB limit. Please choose a smaller image.\nYour file: ${formatFileSize(file.size)}`);
      imageInput.value = '';
      return;
    }

    // Read and display the image
    const reader = new FileReader();

    reader.onload = (event) => {
      imagePreview.src = event.target.result;
      fileName.textContent = file.name;
      fileSize.textContent = formatFileSize(file.size);

      // Show preview and clear button
      imagePreviewContainer.classList.remove('hidden');
      clearImageBtn.classList.remove('hidden');
    };

    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      imageInput.value = '';
    };

    reader.readAsDataURL(file);
  });

  // Clear image handler
  clearImageBtn.addEventListener('click', () => {
    clearImage();
  });

  // Text input handler with character count
  textInput.addEventListener('input', () => {
    updateCharCount();
  });

  // Clear all button handler
  clearAllBtn.addEventListener('click', () => {
    clearImage();
    clearText();
  });

  // Helper function to clear image
  function clearImage() {
    imageInput.value = '';
    imagePreview.src = '';
    fileName.textContent = '';
    fileSize.textContent = '';
    imagePreviewContainer.classList.add('hidden');
    clearImageBtn.classList.add('hidden');
  }

  // Helper function to clear text
  function clearText() {
    textInput.value = '';
    updateCharCount();
  }

  // Helper function to update character count
  function updateCharCount() {
    const count = textInput.value.length;
    charCount.textContent = `${count.toLocaleString()} character${count !== 1 ? 's' : ''}`;
  }

  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Initialize character count
  updateCharCount();
});

