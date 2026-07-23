"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminProductForm from "../../components/AdminProductForm";
import AdminBlockedDates from "../../components/AdminBlockedDates";
import AdminBulkImport from "../../components/AdminBulkImport";

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadProducts() {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadProducts();
  }

  async function handleToggleFeatured(product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: {
