import { Dumbbell } from "lucide-react";

export default function LoadingScreen({ message = "Préparation de votre espace", fullScreen = true,}) {
    return (
        <div role="status" aria-live="polite" className={`flex w-full items-center justify-center bg-slate-50 px-4 py-10 ${  fullScreen ? "min-h-dvh" : "min-h-[350px]" }`}>
            <div className="flex flex-col items-center text-center">
                {/* Spinner */}
                <div aria-hidden="true" className="relative flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 motion-reduce:animate-none" />
                    <Dumbbell size={22} strokeWidth={2} className="text-blue-600" />
                </div>

                {/* Text */}
                <h2 className="mt-5 text-base font-bold tracking-tight text-[#0f1b33]">
                    {message}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    Chargement de vos données...
                </p>
            </div>
        </div>
    );
}