import csv
from typing import Iterator

# some column names in the raw csv have typos/are inconsistent
_CORRECTIONS_DICT: dict[str,str] = {
        "CPIH INDEX 00: ALL ITEMS 2015=100": 
            "CPIH INDEX 00 : ALL ITEMS 2015=100",
        "CPIH INDEX 02:ALCOHOLIC BEVERAGES,TOBACCO & NARCOTICS 2015=100":
            "CPIH INDEX 02 : ALCOHOLIC BEVERAGES,TOBACCO & NARCOTICS 2015=100",
        "CPIH INDEX 04: Housing, water, electricity, gas and other fuels 2015=100":
            "CPIH INDEX 04 : Housing, water, electricity, gas and other fuels 2015=100",
        "CPIH INDEX 04.2: OWNER OCCUPIERS HOUSING COSTS 2015=100":
            "CPIH INDEX 04.2 : OWNER OCCUPIERS HOUSING COSTS 2015=100",
        "CPIH 09.2.1/2/3 : Major durables for in/outdoor recreation and their maintenance 2015=100":
            "CPIH INDEX 09.2.1/2/3 : Major durables for in/outdoor recreation and their maintenance 2015=100",
        "CPIH WEIGHTS 04.2: OWNER OCCUPIERS' HOUSING COSTS":
            "CPIH WEIGHTS 04.2 : OWNER OCCUPIERS' HOUSING COSTS",
        "CPIH WEIGHTS 09.5.3 : MISC. PRINTED MATTER, STATIONERY AND DRAWING MATERIALS":
            "CPIH WEIGHTS 09.5.3/4 : MISC. PRINTED MATTER, STATIONERY AND DRAWING MATERIALS",
        "CPIH WEIGHT 09.2.1/2/3 : Major durables for in/outdoor recreation and their maintenance":
            "CPIH WEIGHTS 09.2.1/2/3 : Major durables for in/outdoor recreation and their maintenance",
        "CPIH WEIGHTS 11.2. : Accommodation services":
            "CPIH WEIGHTS 11.2 : Accommodation services",
}

def parse_csv(lines: Iterator[str]) -> Iterator[dict[str,str]]:
    """Parse CSV rows into dictionaries with cleaned column names.
    Args:
        lines: An iterator over CSV lines, where the first line
            is the header row.
    Yields:
        Each CSV row as a dictionary of cleaned column names -> corresponding values for that row.
    """
    
    header = next(lines)
    col_names = next(csv.reader([header]))
    fieldnames = clean_col_names(col_names)
    reader = csv.DictReader(lines,fieldnames=fieldnames)
    for row in reader:
        yield row

def clean_col_names(col_names: list[str]) -> list[str]:
    """Correct inconsistent entries in a list of column names
    Args:
        col_names: List of original column names.
    Returns:
        List of cleaned column names.
    """
    return [
        _CORRECTIONS_DICT
            .get(col, col)
            .replace(": ", "")
        for col in col_names
    ]