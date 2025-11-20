export async function uploadToIPFS(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/ipfs/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("IPFS upload failed");

  return await res.json(); // { cid }
}
