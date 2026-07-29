import Spinner from "../Spinner/Spinner";

type AsyncButtonContentProps = {
  isLoading: boolean;
  idleLabel: string;
  loadingLabel: string;
};

function AsyncButtonContent({
  isLoading,
  idleLabel,
  loadingLabel,
}: AsyncButtonContentProps) {
  return isLoading ? (
    <>
      <Spinner />
      <span>{loadingLabel}</span>
    </>
  ) : (
    <span>{idleLabel}</span>
  );
}

export default AsyncButtonContent;
