import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/utils';

export function useResource(endpoint, initialFormState = {}) {
    const [items, setItems] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(endpoint);
            setItems(res.data);
            setError(null);
        } catch (err) {
            console.error(`Error fetching ${endpoint}:`, err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`${endpoint}/${editingId}`, formData);
            } else {
                await api.post(endpoint, formData);
            }
            await fetchItems();
            closeForm();
            return true;
        } catch (err) {
            console.error(`Error saving item in ${endpoint}:`, err);
            setError(err);
            return false;
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`${endpoint}/${itemToDelete.id}`);
            await fetchItems();
            setIsDeleteOpen(false);
            setItemToDelete(null);
        } catch (err) {
            console.error(`Error deleting item in ${endpoint}:`, err);
            setError(err);
        }
    };

    const openAddForm = () => {
        setFormData(initialFormState);
        setEditingId(null);
        setIsFormOpen(true);
    };

    const openEditForm = (item) => {
        setFormData(item);
        setEditingId(item.id);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setFormData(initialFormState);
        setEditingId(null);
    };

    const openDeleteConfirm = (item) => {
        setItemToDelete(item);
        setIsDeleteOpen(true);
    };

    const closeDeleteConfirm = () => {
        setIsDeleteOpen(false);
        setItemToDelete(null);
    };

    return {
        items,
        setItems,
        formData,
        setFormData,
        isFormOpen,
        openAddForm,
        openEditForm,
        closeForm,
        isDeleteOpen,
        openDeleteConfirm,
        closeDeleteConfirm,
        itemToDelete,
        handleDelete,
        handleSubmit,
        editingId,
        loading,
        error,
        fetchItems
    };
}
