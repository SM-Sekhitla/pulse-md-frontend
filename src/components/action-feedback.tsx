import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
} from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/api";
import "./action-feedback.css";

const FormPending = createContext(false);
const isPromise = (value: unknown): value is PromiseLike<unknown> =>
  value != null && typeof (value as PromiseLike<unknown>).then === "function";

// Track the actual handler promise so validation, failures and success all
// release the button without timers or a separate loading flag in each page.
export function ActionForm({
  onSubmit,
  children,
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  return (
    <FormPending.Provider value={pending}>
      <form
        {...props}
        aria-busy={pending || undefined}
        onSubmit={async (event) => {
          if (!onSubmit) return;
          event.preventDefault();
          if (inFlight.current) return;
          inFlight.current = true;
          try {
            const result: unknown = onSubmit(event);
            if (isPromise(result)) {
              setPending(true);
              await result;
            }
          } catch (error) {
            toast.error(getApiErrorMessage(error));
          } finally {
            inFlight.current = false;
            setPending(false);
          }
        }}
      >
        {children}
      </form>
    </FormPending.Provider>
  );
}

export const ActionButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function ActionButton(
  { onClick, children, disabled, type, className, ...props },
  ref,
) {
  const formPending = useContext(FormPending);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const busy =
    pending || (formPending && type !== "button" && type !== "reset");
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={`${className ?? ""} action-feedback-button`}
      disabled={disabled || pending || formPending}
      aria-busy={busy || undefined}
      onClick={async (event) => {
        if (inFlight.current || formPending) {
          event.preventDefault();
          return;
        }
        if (!onClick) return;
        inFlight.current = true;
        try {
          const result: unknown = onClick(event);
          if (isPromise(result)) {
            setPending(true);
            await result;
          }
        } catch (error) {
          toast.error(getApiErrorMessage(error));
        } finally {
          inFlight.current = false;
          setPending(false);
        }
      }}
    >
      {busy && (
        <LoaderCircle className="action-feedback-spinner" aria-hidden="true" />
      )}
      {children}
      {busy && (
        <span className="sr-only" role="status">
          Processing, please wait.
        </span>
      )}
    </button>
  );
});
