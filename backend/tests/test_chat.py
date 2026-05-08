def test_chat_module_imports():
    from routers.chat import build_grow_context
    assert callable(build_grow_context)
