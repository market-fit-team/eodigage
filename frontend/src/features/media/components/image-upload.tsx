"use client";

import { useRef } from "react";
import { useUploadMediaAttachment } from "@/shared/api/generated/community/endpoints/media/media";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { apiErrorSchema } from "@/shared/api/api-error-schema";

type ImageUploadProps = {
  onUploadSuccess: (mediaId: number) => void;
};

export function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadMedia, isPending } = useUploadMediaAttachment({
    mutation: {
      onSuccess: (response) => {
        const { id } = response.data;
        if (id) {
          onUploadSuccess(id);
        }
      },
      onError: (error) => {
        console.error("Upload failed:", error);
        const parsedError = apiErrorSchema.safeParse(error);
        toast.error(parsedError.data?.info.message ?? "업로드 실패");
      },
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMedia({ data: { file } });
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isPending}
      />
      <Button onClick={handleClear} variant="secondary" disabled={isPending}>
        초기화
      </Button>
    </div>
  );
}
