export async function updatePayment(id:any, data:any) {
  const res = await fetch(`/api/admin/finances/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour du paiement");
  return res.json();
}
