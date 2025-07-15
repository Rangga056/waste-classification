"use client";

import { useDropzone } from "react-dropzone";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CloudUpload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function UploadForm() {
  const router = useRouter();
  // State now holds file objects with a 'preview' URL property
  const [files, setFiles] = useState([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(""); // For user feedback

  const onDrop = useCallback((acceptedFiles) => {
    // Create a preview URL for each accepted file
    const filesWithPreview = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setFiles((prev) => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: true,
  });

  const removeFile = (fileName) => {
    setFiles(files.filter((file) => file.name !== fileName));
  };

  // Clean up the preview URLs to prevent memory leaks
  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Uploading...");

    if (!username || files.length === 0) {
      setMessage("Please provide a username and at least one file.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("Upload successful! Redirecting...");
        // Use a timeout to allow the user to see the success message
        setTimeout(() => {
          setFiles([]);
          setUsername("");
          router.push("/submissions");
        }, 1500);
      } else {
        const errorData = await res.json();
        setMessage(`Upload failed: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      setMessage("An error occurred during upload.");
      console.error(error);
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
        Upload Your Images
      </h1>
      <p className="text-center text-gray-500 mb-8">
        Drag and drop or click to select files for classification.
      </p>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Left side: Form inputs */}
        <div className="space-y-6">
          <div>
            <Label className="block text-lg font-medium text-gray-700 mb-2">
              Username
            </Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-2 h-12 text-base border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your name"
              required
            />
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer h-64 flex flex-col items-center justify-center transition-colors duration-200 ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <CloudUpload className="text-blue-500 h-16 w-16 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-semibold">
                Drop the files here...
              </p>
            ) : (
              <p className="text-gray-600">
                Drag & drop images here, or{" "}
                <span className="font-semibold text-blue-600">
                  click to select
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Right side: File previews */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-700">
            Image Previews ({files.length})
          </h2>
          {files.length > 0 ? (
            <ul className="h-80 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg border">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={file.preview}
                      alt={file.name}
                      width={64} // Added width
                      height={64} // Added height
                      className="rounded-md object-cover"
                      // This is called when the image is loaded
                      onLoad={() => {
                        URL.revokeObjectURL(file.preview);
                      }}
                    />
                    <div className="text-sm">
                      <p className="font-medium text-gray-800 truncate w-48">
                        {file.name}
                      </p>
                      <p className="text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.name)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border">
              <p className="text-gray-400">No files selected</p>
            </div>
          )}
        </div>

        {/* Submission button and message */}
        <div className="md:col-span-2 w-full flex flex-col justify-center items-center gap-4 mt-4">
          <Button
            type="submit"
            className={
              "w-full md:w-1/2 h-12 text-lg font-semibold cursor-pointer"
            }
            disabled={!username || files.length === 0}
          >
            Upload
          </Button>
          {message && <p className="text-center text-gray-600">{message}</p>}
        </div>
      </form>
    </div>
  );
}
