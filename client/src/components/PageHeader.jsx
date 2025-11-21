export default function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 pt-2 gap-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-sm md:text-base text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {action && (
                <div className="w-full md:w-auto">
                    {action}
                </div>
            )}
        </div>
    );
}
