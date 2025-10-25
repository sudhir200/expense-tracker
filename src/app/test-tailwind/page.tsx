export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          Tailwind Test
        </h1>
        <p className="text-gray-700 mb-4">
          If you can see this styled properly, Tailwind is working!
        </p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Test Button
        </button>
      </div>
    </div>
  );
}
