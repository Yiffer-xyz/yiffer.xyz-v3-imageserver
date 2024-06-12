// turns 1 into 0001, 2 into 0002, etc.
export function padPageNumber(pageNumber: number) {
  return pageNumber.toString().padStart(4, "0");
}
