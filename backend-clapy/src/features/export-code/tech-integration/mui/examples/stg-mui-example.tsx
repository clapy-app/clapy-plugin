export {};
// import {
//   Button,
//   Card,
//   CardActionArea,
//   CardContent,
//   CardHeader,
//   CardMedia,
//   Stack,
//   Tooltip,
//   Typography,
// } from '@mui/material';
//
// function FavoriteButton() {
//   return <Button>Click me</Button>;
// }
//
// const isSafari = false;
// const price = 123;
// const title = 'Hello world';
// const primary_image =
//   'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRVAba92Yz65nC-zVf8_w6bKTXmdXptBuW-OHVnUoIaKBecsEw-FAhAK1Ur9uMcm4zyr2Atsga_lGAfCAg1DTaEKDlH1IlC9YgMiZllmFC8&usqp=CAE';
//
// function ProductTile() {
//   return (
//     <Card
//       square
//       variant='outlined'
//       sx={{
//         overflow: 'visible',
//         maxWidth: 535,
//       }}
//     >
//       <CardActionArea disableRipple>
//         <CardHeader action={<FavoriteButton />} />
//         <CardMedia
//           width='535px'
//           component='img'
//           aria-hidden='true'
//           role='presentation'
//           alt={title}
//           title={`${title}`}
//           image={`${primary_image}&h=227${isSafari ? '&fm=png' : ''}`}
//         />
//         <CardContent>
//           <Tooltip title={title}>
//             <Typography gutterBottom variant='body1' component='h2' noWrap>
//               {title}
//             </Typography>
//           </Tooltip>
//           <Stack alignItems='baseline' spacing={1}>
//             <Typography variant='body2' component='p'>
//               {`$${price}`}
//             </Typography>
//           </Stack>
//         </CardContent>
//       </CardActionArea>
//     </Card>
//   );
// }
