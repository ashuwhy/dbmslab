export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

export const getRole = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('role');
    }
    return null;
};

export const logout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = '/login';
    }
};

export const setAuth = (token: string, role: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        window.dispatchEvent(new Event('auth-change'));
    }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        logout();
    }

    return res;
};
