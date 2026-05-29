import React, { createContext, useContext } from "react";
import API from "@/utils/api";
import { UploadMetadata } from "@/types/upload";
const BASE_URL = import.meta.env.VITE_API_URL;

interface UploadResult {
  videoId?: string;
  url: string;
  success?: boolean;
}



interface UploadContextType {
  upload: (file: File,
    metadata?: UploadMetadata) => Promise<UploadResult | null>;
  uploadImage: (file: File) => Promise<UploadResult | null>;
  getStatus: (videoId: string) => Promise<{ status: string } | null>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      
  const upload = async (
    file: File,
    metadata?: UploadMetadata
  ): Promise<UploadResult | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      // NEW: optional YouTube metadata
      if (metadata?.title) {
        formData.append('title', metadata.title);
      }
  
      if (metadata?.description) {
        formData.append('description', metadata.description);
      }
  
      const res = await API.post('/upload/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      return res.data;
    } catch (error) {
      console.error('Failed to upload video:', error);
      return null;
    }
  };

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await API.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Return the public URL instead of server path
      return { url: `${res.data.file_path}`, success: res.data.success };
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  };

  const getStatus = async (videoId: string): Promise<{ status: string } | null> => {
    try {
      const res = await API.get(`/upload/youtube/status/${videoId}`);
      return res.data;
    } catch (error) {
      console.error("Failed to fetch video status:", error);
      return null;
    }
  };

  return (
    <UploadContext.Provider value={{ upload, uploadImage, getStatus }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = (): UploadContextType => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};
