import { removeElementsWithSimilarClassName } from "./remove-elements-with-similar-class-name";
import DOMPurify from 'dompurify';

export const displayFormValidationError = function (
  className: string,
  parentElement: HTMLElement,
  errorMessage: string
): void {
  removeElementsWithSimilarClassName(className, parentElement);
  const safeErrorMessage = DOMPurify.sanitize(errorMessage || "");
  parentElement.insertAdjacentHTML(
    "beforeend",
    `
			<p class="${className} self-end text-center text-sm bg-red-900 text-plightbg px-2 py-2 rounded-[3px] mt-8">${safeErrorMessage}
			</p>
		`
  );
};

export function clearFormValidationError(errorClassName: string) {
  const errors = document.querySelectorAll(`.${errorClassName}`);
  errors.forEach((el) => el.remove());
}
