export {};
// import * as React from 'react';
// import Box from '@mui/material/Box';
// import TextField from '@mui/material/TextField';
// import Autocomplete from '@mui/material/Autocomplete';
// import LocationOnIcon from '@mui/icons-material/LocationOn';
// import Grid from '@mui/material/Grid';
// import Typography from '@mui/material/Typography';
// import parse from 'autosuggest-highlight/parse';
// import throttle from 'lodash/throttle';
//
// const autocompleteService = { current: null };
//
// interface MainTextMatchedSubstrings {
//   offset: number;
//   length: number;
// }
// interface StructuredFormatting {
//   main_text: string;
//   secondary_text: string;
//   main_text_matched_substrings: readonly MainTextMatchedSubstrings[];
// }
// interface PlaceType {
//   description: string;
//   structured_formatting: StructuredFormatting;
// }
//
// export default function GoogleMaps() {
//   const [value, setValue] = React.useState<PlaceType | null>(null);
//   const [inputValue, setInputValue] = React.useState('');
//   const [options, setOptions] = React.useState<readonly PlaceType[]>([]);
//
//   const fetch = React.useMemo(
//     () =>
//       throttle((request: { input: string }, callback: (results?: readonly PlaceType[]) => void) => {
//         (autocompleteService.current as any).getPlacePredictions(request, callback);
//       }, 200),
//     [],
//   );
//
//   React.useEffect(() => {
//     let active = true;
//
//     if (!autocompleteService.current && (window as any).google) {
//       autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
//     }
//     if (!autocompleteService.current) {
//       return undefined;
//     }
//
//     if (inputValue === '') {
//       setOptions(value ? [value] : []);
//       return undefined;
//     }
//
//     fetch({ input: inputValue }, (results?: readonly PlaceType[]) => {
//       if (active) {
//         let newOptions: readonly PlaceType[] = [];
//
//         if (value) {
//           newOptions = [value];
//         }
//
//         if (results) {
//           newOptions = [...newOptions, ...results];
//         }
//
//         setOptions(newOptions);
//       }
//     });
//
//     return () => {
//       active = false;
//     };
//   }, [value, inputValue, fetch]);
//
//   return (
//     <Autocomplete
//       id='google-map-demo'
//       sx={{ width: 300 }}
//       getOptionLabel={option => (typeof option === 'string' ? option : option.description)}
//       filterOptions={x => x}
//       options={options}
//       autoComplete
//       includeInputInList
//       filterSelectedOptions
//       value={value}
//       onChange={(event: any, newValue: PlaceType | null) => {
//         setOptions(newValue ? [newValue, ...options] : options);
//         setValue(newValue);
//       }}
//       onInputChange={(event, newInputValue) => {
//         setInputValue(newInputValue);
//       }}
//       renderInput={params => <TextField {...params} label='Add a location' fullWidth />}
//       renderOption={(props, option) => {
//         const matches = option.structured_formatting.main_text_matched_substrings;
//         const parts = parse(
//           option.structured_formatting.main_text,
//           matches.map((match: any) => [match.offset, match.offset + match.length]),
//         );
//
//         return (
//           <li {...props}>
//             <Grid container alignItems='center'>
//               <Grid item>
//                 <Box component={LocationOnIcon} sx={{ color: 'text.secondary', mr: 2 }} />
//               </Grid>
//               <Grid item xs>
//                 {parts.map((part, index) => (
//                   <span
//                     key={index}
//                     style={{
//                       fontWeight: part.highlight ? 700 : 400,
//                     }}
//                   >
//                     {part.text}
//                   </span>
//                 ))}
//                 <Typography variant='body2' color='text.secondary'>
//                   {option.structured_formatting.secondary_text}
//                 </Typography>
//               </Grid>
//             </Grid>
//           </li>
//         );
//       }}
//     />
//   );
// }
