import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../../utils/supabase';

// TEMPORARY: test adding a vendor via edge function "create-vendor"
// Delete this once the real LoginPage exists.
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

const testVendor = {
	name: 'Consolidated Edison',
	aliases: ['ConEd', 'Con Edison'],
	portal_url: 'https://www.coned.com',
};

function FunctionTestPage() {
	const [user, setUser] = useState(null);
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	// Keep track of who's logged in (the token lives in localStorage)
	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => setUser(data.user));
		const { data: listener } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				setUser(session?.user ?? null);
			},
		);
		return () => listener.subscription.unsubscribe();
	}, []);

	async function signInTestUser() {
		const { error } = await supabase.auth.signInWithPassword({
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
		});
		if (error) setResult({ status: 'auth error', body: error.message });
	}

	async function callFunction(name, body) {
		setLoading(true);
		setResult(null);

		// invoke() POSTs to /functions/v1/<name> and attaches the
		// apikey + "Authorization: Bearer <user token>" headers for us
		const { data, error } = await supabase.functions.invoke(name, { body });

		if (error) {
			// For non-2xx responses, error.context is the raw Response from the function
			const status = error.context?.status ?? 'network error';
			const body = error.context?.json
				? await error.context.json()
				: error.message;
			setResult({ status, body });
		} else {
			setResult({ status: 201, body: data });
		}
		setLoading(false);
	}

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />

			<main className="min-w-0 flex-1 p-8">
				<h2 className="text-2xl font-bold text-gray-900">
					Edge Function Tests
				</h2>
				<p className="mt-2 text-sm text-gray-600">
					Logged in as:{' '}
					<span className="font-medium">{user?.email ?? 'nobody'}</span>
				</p>

				<div className="mt-6 flex flex-wrap gap-3">
					{user ? (
						<button
							onClick={() => supabase.auth.signOut()}
							className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
						>
							Sign out
						</button>
					) : (
						<button
							onClick={signInTestUser}
							className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
						>
							Sign in as test user
						</button>
					)}

					<button
						onClick={() => callFunction('create-vendor', testVendor)}
						disabled={loading}
						className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
					>
						Send test vendor
					</button>
				</div>

				<p className="mt-6 text-sm text-gray-600">Test vendor:</p>
				<pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
					{JSON.stringify(testVendor, null, 2)}
				</pre>

				{result && (
					<>
						<p className="mt-6 text-sm text-gray-600">
							Response status: {result.status}
						</p>
						<pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
							{JSON.stringify(result.body, null, 2)}
						</pre>
					</>
				)}
			</main>
		</div>
	);
}

export default FunctionTestPage;
