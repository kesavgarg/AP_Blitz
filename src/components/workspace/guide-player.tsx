export function GuidePlayer({
  fileId,
  title,
  body,
  waiting,
}: {
  fileId: string;
  title: string;
  body: string;
  waiting: string;
}) {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink/70">{body}</p>
      {fileId ? (
        <video
          src={`/api/files/${fileId}`}
          controls
          playsInline
          className="mt-6 aspect-video w-full rounded-3xl bg-black"
        />
      ) : (
        <p className="mt-6 rounded-3xl bg-white p-5 text-sm text-ink/70">{waiting}</p>
      )}
    </div>
  );
}
