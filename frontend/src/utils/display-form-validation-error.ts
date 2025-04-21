import { removeElementsWithSimilarClassName } from "./remove-elements-with-similar-class-name";

export const displayFormValidationError = function (
  className: string,
  parentElement: HTMLElement,
  errorMessage: string
): void {
  removeElementsWithSimilarClassName(className, parentElement);
  parentElement.insertAdjacentHTML(
    "beforeend",
    `
			<p class="${className} self-end text-center text-sm bg-red-900 text-plightbg px-2 py-2 rounded-[3px] mt-8">${errorMessage}
			</p>
		`
  );
};
