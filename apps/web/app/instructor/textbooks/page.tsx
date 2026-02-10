'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface Textbook {
    textbook_id: number;
    title: string;
    isbn?: string;
    url?: string;
}

export default function TextbookManagementPage() {
    const [textbooks, setTextbooks] = useState<Textbook[]>([]);
    const [title, setTitle] = useState('');
    const [isbn, setIsbn] = useState('');
    const [url, setUrl] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const loadTextbooks = async () => {
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/instructor/textbooks`);
            if (res.ok) setTextbooks(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTextbooks();
    }, []);

    const handleAddTextbook = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/instructor/textbooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, isbn, url }),
            });

            if (res.ok) {
                setMessage('Textbook added successfully');
                setTitle('');
                setIsbn('');
                setUrl('');
                loadTextbooks();
            } else {
                const err = await res.json();
                setMessage(`Error: ${err.detail}`);
            }
        } catch {
            setMessage('Failed to add textbook');
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Textbook Management</h1>
                <p className="text-zinc-400">Manage course textbooks and resources</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Add Textbook Form */}
                <Card className="lg:col-span-1 h-fit bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Add Textbook</CardTitle>
                        <CardDescription>Add a new textbook to the library</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddTextbook} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Database System Concepts"
                                    className="bg-black/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="isbn">ISBN (Optional)</Label>
                                <Input
                                    id="isbn"
                                    value={isbn}
                                    onChange={(e) => setIsbn(e.target.value)}
                                    placeholder="978-0078022159"
                                    className="bg-black/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">URL (Optional)</Label>
                                <Input
                                    id="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/book"
                                    className="bg-black/20"
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Add Textbook
                            </Button>
                        </form>
                        {message && (
                            <p className={`mt-4 text-sm font-medium ${message.includes('Error') || message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                                {message}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Textbooks List */}
                <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Library</CardTitle>
                        <CardDescription>Total textbooks: {textbooks.length}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        ) : (
                            <div className="rounded-md border border-zinc-800">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-800 hover:bg-transparent">
                                            <TableHead className="w-[60px]">ID</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>ISBN</TableHead>
                                            <TableHead className="text-right">Link</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {textbooks.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                                                    No textbooks found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            textbooks.map((book) => (
                                                <TableRow key={book.textbook_id} className="border-zinc-800 hover:bg-zinc-800/20">
                                                    <TableCell className="font-medium text-zinc-500">#{book.textbook_id}</TableCell>
                                                    <TableCell className="text-zinc-100">{book.title}</TableCell>
                                                    <TableCell className="text-zinc-400">{book.isbn || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        {book.url ? (
                                                            <a
                                                                href={book.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
                                                            >
                                                                View
                                                            </a>
                                                        ) : (
                                                            <span className="text-zinc-600">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
