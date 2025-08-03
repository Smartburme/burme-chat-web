export const validateFile = (file, allowedTypes, maxSizeMB) => {
  const fileType = file.type.split('/')[0];
  const isValidType = allowedTypes.includes(fileType);
  const isValidSize = file.size <= maxSizeMB * 1024 * 1024;

  return {
    isValid: isValidType && isValidSize,
    errors: [
      !isValidType && `File type must be: ${allowedTypes.join(', ')}`,
      !isValidSize && `File size must be under ${maxSizeMB}MB`
    ].filter(Boolean)
  };
};

export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
