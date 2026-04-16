import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppFloat() {
  const handleClick = () => {
    toast.success('Opening WhatsApp...');
    window.open('https://wa.me/918874888221', '_blank');
  };

  return (
    <button
      data-testid="whatsapp-float-btn"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 rounded-full p-4 bg-[#3bb44b] text-white shadow-lg hover:bg-[#233232] transition-colors cursor-pointer wa-pulse btn-hover-scale"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
