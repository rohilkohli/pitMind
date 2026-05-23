import pytest
from backend.services.query_optimizer import get_query_cache, QueryCache, _query_cache
import time

@pytest.fixture(autouse=True)
def reset_query_cache():
    """Reset the global query cache before and after each test."""
    _query_cache.clear()
    yield
    _query_cache.clear()

def test_get_query_cache_returns_singleton():
    """Test that get_query_cache returns the global singleton instance."""
    cache1 = get_query_cache()
    cache2 = get_query_cache()

    assert isinstance(cache1, QueryCache)
    assert cache1 is cache2
    assert cache1 is _query_cache

def test_query_cache_set_and_get():
    """Test setting and getting values from the query cache."""
    cache = get_query_cache()

    cache.set("test_key", {"result": "success"})
    result = cache.get("test_key")

    assert result == {"result": "success"}

def test_query_cache_ttl():
    """Test that cache items expire according to TTL."""
    cache = QueryCache(ttl=0.1)

    cache.set("short_lived_key", "value")
    assert cache.get("short_lived_key") == "value"

    time.sleep(0.15)  # Wait for TTL to expire
    assert cache.get("short_lived_key") is None

def test_query_cache_max_size():
    """Test that cache evicts oldest items when max_size is reached."""
    cache = QueryCache(max_size=2)

    cache.set("key1", "value1")
    time.sleep(0.01)  # Ensure timestamps are different
    cache.set("key2", "value2")
    time.sleep(0.01)

    assert cache.get("key1") == "value1"
    assert cache.get("key2") == "value2"
    assert len(cache._cache) == 2

    # Adding a 3rd item should evict the oldest (key1)
    cache.set("key3", "value3")

    assert cache.get("key1") is None
    assert cache.get("key2") == "value2"
    assert cache.get("key3") == "value3"
    assert len(cache._cache) == 2

def test_query_cache_clear():
    """Test clearing the cache."""
    cache = get_query_cache()

    cache.set("key1", "value1")
    cache.set("key2", "value2")
    assert len(cache._cache) == 2

    cache.clear()
    assert len(cache._cache) == 0
    assert cache.get("key1") is None

def test_query_cache_get_stats():
    """Test getting cache statistics."""
    cache = QueryCache(max_size=10, ttl=60)

    cache.set("key1", "value1")
    cache.set("key2", "value2")

    stats = cache.get_stats()
    assert stats["size"] == 2
    assert stats["max_size"] == 10
    assert stats["ttl"] == 60
