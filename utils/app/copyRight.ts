/* 严格匹配 */
export const copyRightReg = () => /\n\n===\s[\s\S]+\s===$/gm;
/* 松散匹配 */
export const copyRightReg1 = () => /[\n\t]{0,4}===\s[\s\S]+\s===$/gm;

export function copyRightNodeHandler(el: HTMLElement) {
  if (el.nodeName === 'P' && copyRightReg1().test(el.innerText)) {
    el.classList.add('copy-right');
    el.style.opacity = '0.1';
    el.style.fontSize = '10px';
  }
}

export function copyRightHandler() {
  const targetElement = document.querySelector('body') as HTMLElement;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        mutation.addedNodes.forEach(function (node) {
          copyRightNodeHandler(node as HTMLElement);
        });
      }
    });
  });

  const config = { childList: true, subtree: true };

  observer.observe(targetElement, config);

  // setTimeout(() => {
  //   document.querySelectorAll('p').forEach((el) => {
  //     newNodeHandler(el);
  //   });
  // }, 100);
}

export function copyRightInit() {
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', copyRightHandler);
  }
}