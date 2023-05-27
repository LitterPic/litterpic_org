import React from "react";

const ErrorPage = ({ statusCode }) => {
  return (
    <div>
      {statusCode
        ? `An error ${statusCode} occurred on the server`
        : "An error occurred on the client"}
    </div>
  );
};

export default ErrorPage;
