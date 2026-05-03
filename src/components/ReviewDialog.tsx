import { useState } from "react";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointment: { id: string; shop_id: string; staff_id: string; shop_name?: string } | null;
  onSubmitted?: () => void;
}

export const ReviewDialog = ({ open, onOpenChange, appointment, onSubmitted }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!appointment || !user) return;
    setLoading(true);
    const { error } = await supabase.from("reviews").insert({
      appointment_id: appointment.id,
      shop_id: appointment.shop_id,
      staff_id: appointment.staff_id,
      client_user_id: user.id,
      rating,
      comment: comment || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Avaliação enviada", description: "Obrigado pelo feedback!" });
    setComment("");
    setRating(5);
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar atendimento</DialogTitle>
          <DialogDescription>
            {appointment?.shop_name ? `Como foi seu atendimento em ${appointment.shop_name}?` : "Como foi seu atendimento?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110"
                aria-label={`${n} estrelas`}
              >
                <Star
                  className={`size-9 ${n <= rating ? "fill-brand text-brand" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi a experiência (opcional)"
            className="rounded-xl bg-card"
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="hero" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />} Enviar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
