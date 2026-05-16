// SETUP REQUERIDO en Supabase Dashboard:
// Storage → New Bucket → nombre: "service-images" → Public: ON → Create

import React, { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Loader2, AlertCircle, ImageIcon } from 'lucide-react';

const MAX_SIZE_MB = 5;

export default function ImageUpload({ currentUrl, onUpload, folder = 'services' }) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(currentUrl || null);
    const [status, setStatus] = useState('idle'); // idle | uploading | error
    const [errorMsg, setErrorMsg] = useState('');

    const handleClick = () => {
        if (status === 'uploading') return;
        inputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset error state
        setStatus('idle');
        setErrorMsg('');

        // Validate type
        if (!file.type.startsWith('image/')) {
            setStatus('error');
            setErrorMsg('Solo se permiten archivos de imagen.');
            return;
        }

        // Validate size
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setStatus('error');
            setErrorMsg(`La imagen debe ser menor a ${MAX_SIZE_MB}MB.`);
            return;
        }

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setStatus('uploading');

        // Build storage path
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${folder}/${timestamp}-${safeName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('service-images')
            .upload(path, file, { upsert: true });

        if (uploadError) {
            setStatus('error');
            setErrorMsg(`Error al subir: ${uploadError.message}`);
            // Revert preview to previous URL if upload failed
            setPreview(currentUrl || null);
            return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('service-images')
            .getPublicUrl(path);

        setStatus('idle');
        onUpload(publicUrl);

        // Reset input so same file can be re-selected if needed
        e.target.value = '';
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                onClick={handleClick}
                className={`
                    relative w-16 h-12 rounded-lg overflow-hidden cursor-pointer
                    border-2 border-dashed transition-colors group
                    ${status === 'error'
                        ? 'border-red-500 bg-red-950/30'
                        : 'border-zinc-700 bg-zinc-800 hover:border-emerald-500 hover:bg-zinc-700'
                    }
                `}
                title="Haz clic para subir imagen"
            >
                {/* Image or placeholder */}
                {preview && status !== 'error' ? (
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                    </div>
                )}

                {/* Uploading overlay */}
                {status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/70">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    </div>
                )}

                {/* Camera icon overlay on hover (only when not uploading) */}
                {status !== 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/0 group-hover:bg-zinc-900/50 transition-colors">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>

            {/* Error message */}
            {status === 'error' && (
                <div className="flex items-center gap-1 text-xs text-red-400 max-w-[120px] text-center">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
