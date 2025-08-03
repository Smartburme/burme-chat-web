// client/src/utils/errorHandler.js
import * as Sentry from '@sentry/react';

export const logError = (error, context) => {
  Sentry.captureException(error, { extra: context });
  console.error(error);
};
