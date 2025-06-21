/**
 * Loading indicator component
 */
export function Loader() {
  const loaderStyle = {
    animation: "l1 1s infinite",
  };

  return (
    <>
      <style>
        {`
          @keyframes l1 {
            0% {
              transform: perspective(150px) rotateX(0deg);
            }
            100% {
              transform: perspective(150px) rotateX(180deg);
            }
          }
        `}
      </style>
      <div
        className="mx-auto mt-8 aspect-square w-10 bg-gray-500"
        style={loaderStyle}
      />
    </>
  );
}
