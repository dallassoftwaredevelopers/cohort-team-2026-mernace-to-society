

import { useState, useRef } from "react"

function UploadDocument() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)


  function handleFileSelection(selectedFile) {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ]

  if (!allowedTypes.includes(selectedFile.type)) {
    alert("Please select a PDF, JPG, or PNG file.")
    return
  }

  setFile(selectedFile)
}

  return (
    <div className="flex flex-1 flex-col">
      <input
        type="file"
        ref={fileInputRef}
        hidden
        onChange={(e) => {
          const selectedFile = e.target.files[0];

          if (selectedFile) {
            handleFileSelection(selectedFile);
          }

          e.target.value = "";
        }}
      />
      <div
        className={`flex flex-1 flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 text-center ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);

          const droppedFile = e.dataTransfer.files[0];
          if (droppedFile) {
            handleFileSelection(droppedFile);
          }
        }}
      >
        {isDragging ? (
          "Drop your file here!"
        ) : (
          <>
            <p>Click to browse or drag and drop your file here</p>
            <p>Upload your bill or invoice (PDF, JPG, or PNG)</p>
          </>
        )}
      </div>
      {file && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-700">
            Selected file: <span className="font-medium">{file.name}</span>
          </p>

          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      )}

    </div>
  )
}


export default UploadDocument