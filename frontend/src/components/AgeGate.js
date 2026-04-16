import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function AgeGate({ open, onConfirm }) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="age-gate-bg border-none max-w-md mx-4 rounded-3xl p-8">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#3bb44b]/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-white font-['Outfit']">18+</span>
            </div>
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-white font-['Outfit'] text-center">
            Age Verification Required
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#8dac96] text-center text-base mt-3 leading-relaxed">
            This website contains products intended for adults only. By entering, you confirm that you are at least 18 years of age.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-3 mt-6 sm:flex-col">
          <AlertDialogAction
            data-testid="age-gate-confirm-btn"
            onClick={onConfirm}
            className="w-full bg-[#3bb44b] hover:bg-[#61a06c] text-white rounded-full py-3 text-base font-semibold btn-hover-scale border-none"
          >
            I am 18 or older — Enter
          </AlertDialogAction>
          <a
            href="https://www.google.com"
            data-testid="age-gate-leave-btn"
            className="w-full text-center py-3 text-[#8dac96] hover:text-white transition-colors text-sm"
          >
            I am under 18 — Leave
          </a>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
