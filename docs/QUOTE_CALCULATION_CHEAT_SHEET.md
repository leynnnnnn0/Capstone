# Quote Calculation Cheat Sheet

This cheat sheet explains how the system calculates quotation item totals based on product unit type, measurements, quantity, selected options, and standard variants.

## Units

`sqm` means the price is based on square meters.

`sqft` means the price is based on square feet.

`meter` means the price is based on length only.

`piece` and `set` mean the price is based only on quantity.

## Square Meter (`sqm`)

Formula:

```text
width in meters x height in meters = square meters
square meters x price per sqm = item price per piece
item price per piece x pieces = total
```

Example:

```text
Width: 2m
Height: 1.5m
Price: PHP 1,000 / sqm
Pieces: 1

2 x 1.5 = 3 sqm
3 x 1,000 = PHP 3,000
```

## Square Foot (`sqft`)

The system accepts width and height in meters, then converts the area to square feet.

Formula:

```text
width in meters x height in meters = square meters
square meters x 10.7639 = square feet
square feet x price per sqft = item price per piece
item price per piece x pieces = total
```

Example:

```text
Width: 2m
Height: 1.5m
Price: PHP 100 / sqft
Pieces: 1

2 x 1.5 = 3 sqm
3 x 10.7639 = 32.29 sqft
32.29 x 100 = PHP 3,229
```

## Meter (`meter`)

Only length is used.

Formula:

```text
length in meters x price per meter = item price per piece
item price per piece x pieces = total
```

Example:

```text
Length: 4m
Price: PHP 500 / meter
Pieces: 1

4 x 500 = PHP 2,000
```

## Piece or Set (`piece`, `set`)

No width or height calculation is needed.

Formula:

```text
price per piece/set x quantity = total
```

Example:

```text
Price: PHP 7,000 / piece
Pieces: 2

7,000 x 2 = PHP 14,000
```

## Selected Options

Selected options are added to the base price before multiplying by measurement and quantity.

Formula:

```text
(price per unit + selected options) x measurement x pieces = total
```

Example:

```text
Price per sqm: PHP 1,000
Option: Tempered Glass + PHP 200
Measurement: 3 sqm
Pieces: 1

(1,000 + 200) x 3 x 1 = PHP 3,600
```

## Standard Variants

For standard variants, the variant price is used instead of calculating from custom measurements.

Formula:

```text
(variant price + selected options) x pieces = total
```

Example:

```text
Variant price: PHP 7,000
Option: Chrome Hardware + PHP 500
Pieces: 2

(7,000 + 500) x 2 = PHP 15,000
```
