export const removeElementsWithSimilarClassName = function (
  className: string,
  parentElement: HTMLElement
) {
  const allElementsWithSpecificClassName = document.querySelectorAll(
    `.${className}`
  );
  if (!allElementsWithSpecificClassName.length) {
    return;
  }
  for (const element of allElementsWithSpecificClassName) {
    parentElement.removeChild(element);
  }
};
