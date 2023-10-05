import { type ServerWebSocket } from "bun";
import { Elysia, t } from "elysia";
import { type ElysiaWS } from "elysia/ws";
import { type Session } from "lucia";
import { BaseHtml } from "../../components/base";
import { AnchorButtonHtml } from "../../components/Button";
import { HeaderHtml } from "../../components/header";
import { ctx } from "../../context";

const wsConnections = new Set<ElysiaWS<any, any>>();

function dispatch() {
  wsConnections.forEach((connection) => {
    connection.send("refresh");
  });
}

export const play = new Elysia({
  prefix: "/play",
})
  .use(ctx)
  .get("/", ({ html, session }) => html(MatchMakeOptions(session)))
  .get("/1v1", ({ html }) => html(OneVsOne()))
  .get("/2v2", ({ html }) => html(TwoVsTwo()));
//   .ws("/queue", {
//     body: t.Object({
//       message: t.String(),
//     }),
//     beforeHandle(e) {
//       const { body, request } = e;
//       console.log("before handle", body, request);
//     },
//     // upgrade(ws) {
//     //   console.log("ws upgrade", ws);
//     // },
//     error(error) {
//       console.log("ws error", error);
//     },
//     open(ws) {
//       console.log("ws opened");
//       wsConnections.add(ws);
//     },
//     message(ws, message) {
//       console.log("ws message", message);
//       ws.send(message);
//     },
//     // idleTimeout: 1000 * 60 * 60 * 24,
//     close(ws) {
//       console.log("ws close");
//       wsConnections.delete(ws);
//     },
//   });

function OneVsOne() {
  return (
    <>
      <div class="flex flex-col" hx-ext="ws" ws-connect="/play/queue/1v1">
        <div id="queue-status">
          {/* <span class="p-4">Waiting for 1 player more..</span> */}
        </div>
      </div>
    </>
  );
}

function TwoVsTwo() {
  return (
    <>
      <div class="flex flex-col" hx-ext="ws" ws-connect="/play/queue/2v2">
        <div id="queue-status">
          {/* <span class="p-4">Waiting for 1 player more..</span> */}
        </div>
      </div>
    </>
  );
}

export async function MatchMakeOptions(session: Session | null) {
  return (
    <>
      <BaseHtml session={session}>
        <HeaderHtml title="Play" />
        <div class="flex flex-col items-center justify-center">
          {/* <div class="flex flex-col items-center justify-center px-3 pb-12 md:px-4 md:pb-24 lg:px-12"> */}
          <h1 class="p-4 text-2xl font-semibold  text-gray-900 dark:text-white">
            What would you like to queue for?
          </h1>
          <div class="flex-row justify-between">
            <AnchorButtonHtml text="1v1" hxGet="/play/1v1" hxTarget="#queue" />
            <AnchorButtonHtml text="2v2" hxGet="/play/2v2" hxTarget="#queue" />
          </div>
          <div id="queue" class="flex-row justify-between"></div>
        </div>
      </BaseHtml>
    </>
  );
}
