#!/usr/bin/env python
"""Test search functionality"""

import requests
import json

BASE_URL = 'http://localhost:5000/api'

def test_search():
    tests = [
        ("MacBook", "Search by product name"),
        ("Apple", "Search by brand"),
        ("RTX", "Search by specs"),
        ("Xerox", "Search non-existent (should be 0)"),
        ("", "Empty search (should return all)"),
    ]
    
    print("=" * 60)
    print("SEARCH FUNCTIONALITY TEST")
    print("=" * 60)
    
    for query, description in tests:
        try:
            url = f"{BASE_URL}/search?q={query}" if query else f"{BASE_URL}/search"
            response = requests.get(url)
            results = response.json()
            count = len(results) if isinstance(results, list) else 0
            
            print(f"\n✓ {description}")
            print(f"  Query: '{query}' → Found {count} result(s)")
            
            if count > 0 and query:
                first = results[0]
                print(f"  First: {first.get('name', 'N/A')} - ${first.get('price', 'N/A')}")
                if 'brand' in first:
                    print(f"  Brand: {first['brand']}")
        except Exception as e:
            print(f"\n✗ {description}")
            print(f"  Error: {str(e)}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    test_search()
