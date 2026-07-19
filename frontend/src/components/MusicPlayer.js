/** @format */
import React from "react";
import { Grid2, Typography, Card, IconButton, LinearProgress } from "@mui/material";
import { PlayArrow, Pause, SkipNext } from "@mui/icons-material";

const MusicPlayer = (props) => {
	const pauseSong = () => {
		const reqOps = {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "pause" }),
		};
		fetch("/spotify/song_control", reqOps);
	};

	const playSong = () => {
		const reqOps = {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "play" }),
		};
		fetch("/spotify/song_control", reqOps);
	};

	const skipSong = () => {
		const reqOps = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
		};
		fetch("/spotify/song_control", reqOps).then((res) => res.json());
		// .then((data) => console.log(data));
	};

	const btnControl = () => {
		if (props.is_playing) {
			pauseSong();
		} else {
			playSong();
		}
	};

	const songProgress = (props.time / props.duration) * 100;
	return (
		<Card>
			<Grid2
				container
				spacing={4}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}>
				<Grid2 size={4}>
					<img src={props.image_url} height="100%" width="100%" />
				</Grid2>
				<Grid2 size={8}>
					<Typography component="h5" variant="h5">
						{props.title}
					</Typography>
					<Typography variant="subtitle1" color="textSecondary">
						{props.artist}
					</Typography>
					<div>
						<IconButton onClick={btnControl}>
							{props.is_playing ? <Pause /> : <PlayArrow />}
						</IconButton>
						<IconButton onClick={skipSong}>
							<SkipNext />
						</IconButton>
					</div>
				</Grid2>
			</Grid2>
			<LinearProgress variant="determinate" value={songProgress} />
		</Card>
	);
};

export default MusicPlayer;
