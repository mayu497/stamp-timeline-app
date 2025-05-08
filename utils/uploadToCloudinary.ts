export const uploadToCloudinary = async (localUri: string): Promise<string | null> => {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "anon_upload");

    const res = await fetch("https://api.cloudinary.com/v1_1/dgvd0srg2/image/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    console.log("✅ Upload response", json);
    return json.secure_url;
  } catch (err) {
    console.error("❌ Cloudinary upload error:", err);
    return null;
  }
};
