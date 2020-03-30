import PCancelable from "p-cancelable";

const lastPromise = callOnCancel => {
  let lastPromise;

  return promise => {
    if (lastPromise) lastPromise.cancel();

    const current = new PCancelable((resolve, reject, onCancel) => {
      Promise.resolve(promise)
        .then(resolve)
        .catch(reject);

      if (callOnCancel) {
        onCancel(callOnCancel);
      }
    });

    lastPromise = current;

    return current.catch(error => {
      if (current.isCanceled) {
        return { then: () => {} };
      }
      throw error;
    });
  };
};

export default lastPromise;
