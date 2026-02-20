'use client';

import { useState, useEffect } from 'react';

interface UserData {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    profileImage?: string;
}

export default function StudentSettings() {
    const [formData, setFormData] = useState<UserData>({
        id: '',
        email: '',
        fullName: '',
        phone: '',
        profileImage: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    // Récupérer les données de l'utilisateur
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('travelExpressToken') || localStorage.getItem('authToken');
                const response = await fetch('/api/auth/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch user data');

                const data = await response.json();
                setFormData({
                    id: data.id,
                    email: data.email,
                    fullName: data.fullName || '',
                    phone: data.phone || '',
                    profileImage: data.profileImage || '',
                });
            } catch (error) {
                setMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('travelExpressToken') || localStorage.getItem('authToken');
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la mise à jour');
            }

            setMessage({ type: 'success', text: 'Profil mis à jour avec succès ✓' });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
            setSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('travelExpressToken') || localStorage.getItem('authToken');
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    password: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors du changement de mot de passe');
            }

            setMessage({ type: 'success', text: 'Mot de passe changé avec succès ✓' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem', color: '#1a202c' }}>⚙️ Paramètres du profil</h1>

            {message && (
                <div
                    style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        borderRadius: '0.5rem',
                        backgroundColor: message.type === 'success' ? '#c6f6d5' : '#fed7d7',
                        color: message.type === 'success' ? '#22543d' : '#742a2a',
                        border: `1px solid ${message.type === 'success' ? '#9ae6b4' : '#fc8181'}`,
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Formulaire profil */}
            <form onSubmit={handleSaveProfile} style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#2d3748' }}>Informations personnelles</h2>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Nom complet
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Téléphone
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+226 XX XX XX XX"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: saving ? '#cbd5e0' : '#4299e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: 500,
                    }}
                >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                </button>
            </form>

            {/* Formulaire changement mot de passe */}
            <form onSubmit={handleChangePassword}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#2d3748' }}>Sécurité</h2>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Mot de passe actuel
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.375rem',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Nouveau mot de passe
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Confirmer le mot de passe
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    Afficher les mots de passe
                </label>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: saving ? '#cbd5e0' : '#ed8936',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: 500,
                    }}
                >
                    {saving ? 'Mise à jour...' : 'Changer le mot de passe'}
                </button>
            </form>
        </div>
    );
}
