import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle } from 'lucide-react';

function isPdfFile(file) {
  return Boolean(file) && (
    file.type === 'application/pdf' ||
    file.name?.toLowerCase().endsWith('.pdf')
  );
}

export default function PolicyUpload({ onFileSelect, isAnalyzing, isComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleFile = useCallback((file) => {
    if (isPdfFile(file)) {
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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex items-center gap-3 rounded-xl border border-covered/20 bg-covered/5 p-4"
      >
        <CheckCircle className="h-5 w-5 text-covered" />
        <div>
          <p className="text-sm font-medium text-text-primary">{fileName}</p>
          <p className="text-xs text-covered">Analysis complete</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01, borderColor: '#3b82f6' }}
      transition={{ duration: 0.2 }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition
        ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}`}
    >
      <input type="file" accept=".pdf,application/pdf" onChange={onInput}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
            </motion.div>
            <p className="text-sm text-text-secondary">Analyzing policy...</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {fileName ? (
              <FileText className="mx-auto mb-2 h-10 w-10 text-primary" />
            ) : (
              <Upload className="mx-auto mb-2 h-10 w-10 text-text-secondary" />
            )}
            <p className="text-sm font-medium text-text-primary">
              {fileName || 'Drop your insurance policy PDF here'}
            </p>
            <p className="mt-1 text-xs text-text-secondary">or click to browse</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
