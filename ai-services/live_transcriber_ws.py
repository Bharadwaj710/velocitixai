import asyncio
import websockets
import tempfile
import whisper
import wave
import os

model = whisper.load_model("base")

async def transcribe_audio(websocket, path):
    print(f"New connection at path: {path}")

    while True:
        try:
            print("Waiting for audio chunk...")
            data = await websocket.recv()
            if isinstance(data, str):
                print("Received text data, skipping")
                continue

            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
                tmp_file.write(data)
                tmp_file_path = tmp_file.name

            print(f"Saved temporary audio: {tmp_file_path}")
            result = model.transcribe(tmp_file_path)
            transcript = result["text"]
            print(f"Transcript: {transcript}")
            await websocket.send(transcript)

            os.remove(tmp_file_path)

        except Exception as e:
            print(f"Error: {e}")
            break

async def main():
    async with websockets.serve(transcribe_audio, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
