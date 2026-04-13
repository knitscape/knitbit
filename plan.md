# Dev plan

## Data structure

The final knitting program will consist of:

- a bitmap of width m (columns) and height n (rows) where each cell is assigned
  one of the base knitting actions
  - miss (yarn feeder moves past a needle, no needle action occurs)
  - front bed knit (yarn is knit on the front bed)
  - front bed tuck (yarn is laid into a needle on the front bed, but not knit)
  - back bed knit (yarn is knit on the back bed)
  - back bed tuck (yarn is laid into a needle on the back bed, but not knit)
  - transfer front to back (a loop is moved from the front bed needle to the
    back bed needle, effectively merging with any loop(s) already on that
    needle)
  - transfer back to front (a loop is moved from the back bed needle to the
    front bed needle, effectively merging with any loop(s) already on that
    needle)
- a set of control columns of height n which contains some additional metadata
  related to machine execution. the bare minimum for the purposes of this tool
  are:
  - yarn feeder index (which yarn is knitting in that row)
  - carriage pass direction (the direction the carriage moves in that row)
  - racking (the relative offset between the beds, which determines which needle
    a transferred loop will end up on)

## Interface

### Script pane

- uses codemirror
- autocomplete operation names
- there should be a special bitmap editor. e.g., a bitmap is ultimately just an
  array of indices which correspond to colors. we could write out the data for a
  bitmap directly in the script pane. but I want to identify that array and have
  a little icon you can click to edit the bitmap in a bitmap editor.
  -
