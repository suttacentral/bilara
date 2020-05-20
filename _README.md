# \<bilara\>

Bilara is a Computer Assisted Translation (CAT) webapp built by SuttaCentral to translate Buddhist scriptures. “Bilara” means “cat” in Pali!

Bilara provides a customizable interface for viewing and editing texts for translation. Unlike most translation apps, the focus is on translating *texts*, not UI. Thus the translation area is kept minimal, with a focus on the flow of text.

Bilara takes a set of JSON files from `bilara-data` and serves them to the webapp. It doesn’t use GETTEXT or similar translation formats. Rather, each segment is assigned a unique JSON key, and may be represented by strings of different types in different directories. There is no limit to the amount of different translations or associated material, such as notes, etc.

Backend is built from python, with Translation Memory and Search/Replace powered by ArangoDB.

Front end is built on LitElement.

We have taken the liberty of naming some color themes in Pali. Thanks to Ethan Schoonover for [Solarized and Lunarized themes](https://ethanschoonover.com/solarized/) (= suriya and candima), and to Mina Markham for [Yoncé theme](https://yoncetheme.com/) (= gandhabba).

## Dev Installation

https://github.com/suttacentral/bilara/wiki/Dev-Installation
