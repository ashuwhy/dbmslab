'use client';

import { useState } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { useParams } from 'next/navigation';

export default function CourseContentPage() {
    const params = useParams();
    const courseId = params.id as string;

    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [contentType, setContentType] = useState('pdf');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/instructor/courses/${courseId}/content-items`, {
                method: 'POST',
                body: JSON.stringify({ title, url, content_type: contentType }),
            });

            if (res.ok) {
                setMessage('Content added successfully!');
                setTitle('');
                setUrl('');
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to add content');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Manage Content: {courseId}</h1>

            <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add New Content Item</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">URL</label>
                        <input
                            type="url"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value)}
                        >
                            <option value="pdf">PDF Document</option>
                            <option value="video">Video</option>
                            <option value="link">Web Link</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Add Content
                    </button>
                </form>
                {message && <p className="mt-4 text-sm font-medium text-gray-900">{message}</p>}
            </div>
        </div>
    );
}
