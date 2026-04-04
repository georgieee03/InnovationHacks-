import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export default function PolicyUpload({ onFileSelect, isAnalyzing, isComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleFile = useCallback((file) => {
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onInput = useCallback((e) => {
    handleFile(e.target.files[0]);
  }, [handleFile]);

  if (isComplete && fileName) {
    return (
      <div className="flex items-center gap-3 p-4 bg-covered/5 border border-covered/20 rounded-xl">
        <CheckCircle className="w-5 h-5 text-covered" />
        <div>
          <p className="text-sm font-medium text-text-primary">{fileName}</p>
          <p className="text-xs text-covered">Analysis complete</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer
        ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}`}
    >
      <input type="file" accept=".pdf" onChange={onInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      {isAnalyzing ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Analyzing policy...</p>
        </div>
      ) : (
        <>
          {fileName ? (
            <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
          ) : (
            <Upload className="w-10 h-10 text-text-secondary mx-auto mb-2" />
          )}
          <p className="text-sm font-medium text-text-primary">
            {fileName || 'Drop your insurance policy PDF here'}
          </p>
          <p className="text-xs text-text-secondary mt-1">or click to browse</p>
        </>
      )}
    </div>
  );
}
