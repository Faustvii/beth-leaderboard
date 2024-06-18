import { Elysia } from "elysia";
import { type ElysiaWS } from "elysia/ws";
import { type Session, type User } from "lucia";
import { ctx } from "../context";

const oneVsOneQueue: QueuedPlayer[] = [];
const twovsTwoQueue: QueuedPlayer[] = [];

interface QueuedPlayer {
  User: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Connection: ElysiaWS<any, any>;
}

function handle1v1() {
  handleQueue(2, oneVsOneQueue);
}

function handle2v2() {
  handleQueue(4, twovsTwoQueue);
}

function handleQueue(players: number, queue: QueuedPlayer[]) {
  queue.forEach((x) => {
    console.log("sending message to ", x.User.name);

    if (queue.length >= players) {
      x.Connection.send(
        <>
          <div
            id="queue-status"
            class="flex flex-col items-center justify-center"
          >
            <span class="p-4">
              {`Match between ${queue
                .map((x) => x.User.name)
                .join(" & ")} has been
              found!`}
            </span>
          </div>
        </>,
      );
      return;
    }
    x.Connection.send(
      <>
        <div id="queue-status" class="flex flex-col">
          <span class="p-4">
            You're in queue for {players == 2 ? "1v1" : "2v2"}
          </span>
          <span class="p-4">
            Waiting for {players - queue.length} player{players == 2 ? "" : "s"}{" "}
            more..
          </span>
        </div>
      </>,
    );
  });

  if (queue.length >= players) {
    queue.splice(0, players);
    console.log("emptied queue", queue.length);
  }
}

export const playSocket = new Elysia()
  .use(ctx)
  .ws("/play/queue/1v1", {
    //@ts-expect-error types?
    open(ws) {
      const session = ws.data.session;
      if (!session?.user) {
        console.log("no user");
        return ws.close();
      }
      console.log("user", session.user.name, "joined 1v1 queue");
      if (twovsTwoQueue.find((x) => x.User.name === session.user.name)) {
        console.log("removed from 2v2 because joined 1v1");
        twovsTwoQueue.splice(
          twovsTwoQueue.findIndex((x) => x.User.name === session.user.name),
          1,
        );
        handle2v2();
      }
      if (oneVsOneQueue.find((x) => x.User.name === session.user.name)) {
        return;
      }
      oneVsOneQueue.push({ User: session.user, Connection: ws });
      handle1v1();
    },

    message(ws, message) {
      const session = ws.data.session;
      if (!session?.user) {
        return ws.close();
      }
      ws.send(message);
    },
    close(ws) {
      const session = ws.data.session;
      // wsConnections.delete(ws);
      console.log("ws closing");

      if (session?.user) {
        oneVsOneQueue.splice(
          oneVsOneQueue.findIndex((x) => x.User.name === session.user.name),
          1,
        );
        console.log("removed user from queue", session.user.name);
      }
      // ws.publish("1v1", {
      //   message: `${session?.user.name} has left the room`,
      //   name: "notice",
      //   time: Date.now(),
      // });
      handle1v1();
    },
    // body: t.String(),
    // query: t.Optional(),
    // response: t.Object({
    //   message: t.String(),
    //   name: t.String(),
    //   time: t.Number(),
    // }),
  })
  .ws("/play/queue/2v2", {
    open(ws) {
      const session = ws.data.session;
      if (!session?.user) {
        console.log("no user");
        return ws.close();
      }
      console.log("user", session.user.name, "joined 2v2 queue");

      if (oneVsOneQueue.find((x) => x.User.name === session.user.name)) {
        oneVsOneQueue.splice(
          oneVsOneQueue.findIndex((x) => x.User.name === session.user.name),
          1,
        );
        handle1v1();
      }
      if (twovsTwoQueue.find((x) => x.User.name === session.user.name)) {
        return;
      }
      twovsTwoQueue.push({ User: session.user, Connection: ws });
      handle2v2();
    },
    message(ws, message) {
      const session: Session | null = ws.data.session;
      if (!session?.user) {
        return ws.close();
      }
      ws.send(message);
    },
    close(ws) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session: Session | null = ws.data.session;
      // wsConnections.delete(ws);
      console.log("ws closing");
      if (session?.user) {
        twovsTwoQueue.splice(
          twovsTwoQueue.findIndex((x) => x.User.name === session.user.name),
          1,
        );
        console.log("removed user from queue", session.user.name);
      }
      // ws.publish("1v1", {
      //   message: `${session?.user.name} has left the room`,
      //   name: "notice",
      //   time: Date.now(),
      // });
      handle2v2();
    },
    // body: t.String(),
    // query: t.Optional(),
    // response: t.Object({
    //   message: t.String(),
    //   name: t.String(),
    //   time: t.Number(),
    // }),
  });
